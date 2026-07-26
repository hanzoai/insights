import re
import ssl
import sys
import enum
import json
import uuid
import socket
import typing
import asyncio
import datetime as dt
import contextlib
import collections.abc
from string import Formatter
from urllib.parse import urljoin

from django.conf import settings

import aiohttp
import pyarrow as pa
import requests
from structlog import get_logger
from temporalio import activity

import insights.temporal.common.asyncpa as asyncpa
from insights.datastore import query_tagging
from insights.datastore.query_tagging import QueryTags, TemporalTags, get_query_tags

LOGGER = get_logger(__name__)


def encode_datastore_data(data: typing.Any, quote_char="'") -> bytes:
    """Encode data for Datastore.

    Depending on the type of data the encoding is different.

    Returns:
        The encoded bytes.
    """
    match data:
        case None:
            return b"NULL"

        case uuid.UUID():
            return f"{quote_char}{data}{quote_char}".encode()

        case int() | float():
            if isinstance(data, float) and data.is_integer():
                return f"{int(data)}".encode()
            return f"{data}".encode()

        case dt.datetime():
            timezone_arg = ""
            if data.tzinfo:
                timezone_arg = f", '{data:%Z}'"

            if data.microsecond == 0:
                return f"toDateTime('{data:%Y-%m-%d %H:%M:%S}'{timezone_arg})".encode()
            return f"toDateTime64('{data:%Y-%m-%d %H:%M:%S.%f}', 6{timezone_arg})".encode()

        case list():
            encoded_data = [encode_datastore_data(value) for value in data]
            result = b"[" + b",".join(encoded_data) + b"]"
            return result

        case tuple():
            encoded_data = [encode_datastore_data(value) for value in data]
            result = b"(" + b",".join(encoded_data) + b")"
            return result

        case dict():
            # Encode dictionaries as JSON, as it can represent a Python dictionary in a way Datastore understands.
            # This means INSERT queries with dictionary data are only supported with 'FORMAT JSONEachRow', which
            # is enough for now as most if not all of our INSERT query workloads are in unit test setup.
            encoded_data = []
            quote_char = '"'  # JSON requires double quotes.

            for key, value in data.items():
                if isinstance(value, dt.datetime):
                    value = str(value.timestamp())
                elif isinstance(value, uuid.UUID) or isinstance(value, str):
                    value = str(value)

                encoded_data.append(
                    f'"{str(key)}"'.encode() + b":" + encode_datastore_data(value, quote_char=quote_char)
                )

            result = b"{" + b",".join(encoded_data) + b"}"
            return result

        case _:
            str_data = str(data)
            str_data = str_data.replace("\\", "\\\\").replace("'", "\\'")
            return f"{quote_char}{str_data}{quote_char}".encode()


class DatastoreQueryStatus(enum.StrEnum):
    FINISHED = "Finished"
    RUNNING = "Running"
    ERROR = "Error"


class ChunkBytesAsyncStreamIterator:
    """Async iterator of HTTP chunk bytes.

    Similar to the class provided by aiohttp, but this allows us to control
    when to stop iteration.
    """

    def __init__(self, stream: aiohttp.StreamReader) -> None:
        self._stream = stream

    def __aiter__(self) -> "ChunkBytesAsyncStreamIterator":
        return self

    async def __anext__(self) -> bytes:
        data, end_of_chunk = await self._stream.readchunk()

        if data == b"" and end_of_chunk is False and self._stream.at_eof():
            raise StopAsyncIteration

        return data


class DatastoreClientNotConnected(Exception):
    """Exception raised when attempting to run an async query without connecting."""

    def __init__(self):
        super().__init__("DatastoreClient is not connected. Are you running in a context manager?")


class DatastoreError(Exception):
    """Base Exception representing anything going wrong with Datastore."""

    def __init__(self, error_message, query: str | None = None, query_id: str | None = None):
        self.query = query
        self.query_id = query_id
        super().__init__(error_message)


class DatastoreAllReplicasAreStaleError(DatastoreError):
    """Exception raised when all replicas are stale."""

    def __init__(self, error_message, query: str | None = None, query_id: str | None = None):
        super().__init__(error_message, query, query_id)


class DatastoreClientTimeoutError(DatastoreError):
    """Exception raised when `DatastoreClient` timed-out waiting for a response.

    This does not indicate the query failed as the timeout is local.
    """

    def __init__(self, query, query_id: str):
        super().__init__(f"Timed-out waiting for response running query '{query_id}'", query, query_id)


class DatastoreQueryNotFound(DatastoreError):
    """Exception raised when a query with a given ID is not found."""

    def __init__(self, query_id: str):
        super().__init__(f"Query with ID '{query_id}' was not found in query log", query_id=query_id)


class DatastoreMemoryLimitExceededError(DatastoreError):
    """Exception raised when a query exceeds the memory limit."""

    def __init__(self, error_message, query: str | None = None, query_id: str | None = None):
        super().__init__(error_message, query, query_id)


class DatastoreCheckQueryStatusError(DatastoreError):
    """Exception raised when checking the status of a query fails."""

    def __init__(self, error_message: str, query_id: str | None = None):
        super().__init__(error_message, query_id=query_id)


def update_query_tags_with_temporal_info(query_tags: typing.Optional[QueryTags] = None):
    """
    Updates query_tags with a temporal workflow's properties.

    :param query_tags: QueryTags object to update, if None, then the global object is updated.
    :return:
    """
    if not activity.in_activity():
        return
    if not query_tags:
        query_tags = get_query_tags()
    info = activity.info()
    temporal_tags = TemporalTags(
        workflow_namespace=info.workflow_namespace,
        workflow_type=info.workflow_type,
        workflow_id=info.workflow_id,
        workflow_run_id=info.workflow_run_id,
        activity_type=info.activity_type,
        activity_id=info.activity_id,
        attempt=info.attempt,
    )
    query_tags.with_temporal(temporal_tags)


def add_log_comment_param(params: dict[str, typing.Any], query_tags: typing.Optional[QueryTags] = None):
    """
    Collects temporal tags and adds them to existing tags.

    If the query has log_comment placeholder, present as param_log_comment then this param is parsed and updated instead
    of adding a new log_comment param

    :param params: HTTP parameters, all query parameters have prefix param_,
                   others are query settings (e.g. max_execution_time or log_comment)
    :param query_tags: QueryTags object to be used, if None, then the global object is copied.
    :return:
    """
    query_tags = query_tags or query_tagging.get_query_tags().model_copy()
    param_name = "log_comment"
    if "param_log_comment" in params:
        with contextlib.suppress(Exception):
            qt = QueryTags.model_validate_json(params["param_log_comment"])
            query_tags.update(**qt.model_dump())
            param_name = "param_log_comment"
    update_query_tags_with_temporal_info(query_tags)
    params[param_name] = query_tags.to_json()


class KeywordOnlyFormatter(Formatter):
    """Formatter supporting only keyword arguments.

    Positional arguments are unchanged, missing keys are also left unchanged.
    """

    def get_value(self, key, args, kwargs):
        if isinstance(key, int):
            # Returns '{n}' unchanged, where n is a numerical index.
            return f"{{{key}}}"
        try:
            return kwargs[key]
        except KeyError:
            # Returns '{key}' unchanged
            return f"{{{key}}}"


class DatastoreClient:
    """An asynchronous client to access Datastore via HTTP.

    Attributes:
        session: The underlying aiohttp.ClientSession used for HTTP communication.
        url: The URL of the Datastore cluster.
        headers: Headers sent to Datastore in an HTTP request. Includes authentication details.
        params: Parameters passed as query arguments in the HTTP request. Common ones include the
            Datastore database and the 'max_execution_time'.
    """

    def __init__(
        self,
        url: str = "http://localhost:8123",
        user: str = "default",
        password: str = "",
        database: str = "default",
        timeout: None | aiohttp.ClientTimeout = None,
        ssl: ssl.SSLContext | bool = True,
        **kwargs,
    ):
        self.url = url
        self.headers = {}
        self.params = {}
        self.timeout = timeout
        self.ssl = ssl
        self.connector: None | aiohttp.TCPConnector = None
        self.session: None | aiohttp.ClientSession = None
        self.logger = LOGGER.bind(url=url, database=database, user=user)

        if user:
            self.headers["X-Datastore-User"] = user
        if password:
            self.headers["X-Datastore-Key"] = password
        if database:
            self.params["database"] = database

        self.params.update(kwargs)

    @classmethod
    def from_insights_settings(cls, settings, **kwargs):
        """Initialize a DatastoreClient from Insights settings."""
        return cls(
            url=settings.DATASTORE_URL,
            user=settings.DATASTORE_USER,
            password=settings.DATASTORE_PASSWORD,
            database=settings.DATASTORE_DATABASE,
            **kwargs,
        )

    async def is_alive(self, timeout: float = 30.0) -> bool:
        """Check if the connection is alive by sending a ping request.

        Returns:
            A boolean indicating whether the connection is alive.
        """
        if self.session is None:
            raise DatastoreClientNotConnected()

        ping_url = urljoin(self.url, "ping")

        try:
            await self.session.get(
                url=ping_url,
                headers=self.headers,
                raise_for_status=True,
                timeout=aiohttp.ClientTimeout(total=timeout),
            )
        except aiohttp.ClientResponseError as exc:
            self.logger.exception("Failed Datastore liveness check", exc_info=exc)
            return False
        except TimeoutError:
            self.logger.exception("Datastore liveness check timed out after %s seconds", timeout)
            return False
        return True

    def prepare_query(self, query: str, query_parameters: None | dict[str, typing.Any] = None) -> str:
        """Prepare the query being sent by encoding and formatting it with the provided parameters.

        Returns:
            The formatted query.
        """
        if not query_parameters:
            return query

        has_format_placeholders = re.search(r"(?<!{){[^{}]*}(?!})|{{[^{}]*}}", query)

        format_parameters = {k: encode_datastore_data(v).decode("utf-8") for k, v in query_parameters.items()}
        query = query % format_parameters

        if has_format_placeholders:
            query = KeywordOnlyFormatter().format(query, **format_parameters)

        return query

    def prepare_request_data(self, data: collections.abc.Sequence[typing.Any]) -> bytes | None:
        """Prepare the request data sent by encoding it.

        Returns:
            The request data to be passed as the body of the request.
        """
        if len(data) > 0:
            request_data = b",".join(encode_datastore_data(value) for value in data)
        else:
            request_data = None
        return request_data

    async def acheck_response(self, response, query) -> None:
        """Asynchronously check the HTTP response received from Datastore.

        Raises:
            DatastoreAllReplicasAreStaleError: If status code is not 200 and error message contains
                "ALL_REPLICAS_ARE_STALE". This can happen when using max_replica_delay_for_distributed_queries
                and fallback_to_stale_replicas_for_distributed_queries=0
            DatastoreMemoryLimitExceededError: If the status code is not 200 and error message contains
                "MEMORY_LIMIT_EXCEEDED".
            DatastoreError: If the status code is not 200.
        """
        if response.status != 200:
            error_message = await response.text()
            if "ALL_REPLICAS_ARE_STALE" in error_message:
                raise DatastoreAllReplicasAreStaleError(error_message, query=query)
            if "MEMORY_LIMIT_EXCEEDED" in error_message:
                raise DatastoreMemoryLimitExceededError(error_message, query=query)
            raise DatastoreError(error_message, query=query)

    def check_response(self, response, query) -> None:
        """Check the HTTP response received from Datastore.

        Raises:
            DatastoreAllReplicasAreStaleError: If status code is not 200 and error message contains
                "ALL_REPLICAS_ARE_STALE". This can happen when using max_replica_delay_for_distributed_queries
                and fallback_to_stale_replicas_for_distributed_queries=0
            DatastoreMemoryLimitExceededError: If the status code is not 200 and error message contains
                "MEMORY_LIMIT_EXCEEDED".
            DatastoreError: If the status code is not 200.
        """
        if response.status_code != 200:
            error_message = response.text
            if "ALL_REPLICAS_ARE_STALE" in error_message:
                raise DatastoreAllReplicasAreStaleError(error_message, query=query)
            if "MEMORY_LIMIT_EXCEEDED" in error_message:
                raise DatastoreMemoryLimitExceededError(error_message, query=query)
            raise DatastoreError(error_message, query=query)

    @contextlib.asynccontextmanager
    async def aget_query(
        self, query, query_parameters, query_id
    ) -> collections.abc.AsyncIterator[aiohttp.ClientResponse]:
        """Send a GET request to the Datastore HTTP interface with a query.

        Only read-only queries may be sent as a GET request. For inserts, use apost_query.

        The context manager protocol is used to control when to release the response.

        Query parameters will be formatted with string formatting and additionally sent to
        Datastore in the query string.

        Arguments:
            query: The query to POST.
            *data: Iterable of values to include in the body of the request. For example, the tuples of VALUES for an INSERT query.
            query_parameters: Parameters to be formatted in the query.
            query_id: A query ID to pass to Datastore.

        Returns:
            The response received from the Datastore HTTP interface.
        """
        if self.session is None:
            raise DatastoreClientNotConnected()

        params = {**self.params}
        if query_id is not None:
            params["query_id"] = query_id

        # Certain views, like person_batch_exports* still rely on us formatting arguments.
        params["query"] = self.prepare_query(query, query_parameters)

        # TODO: Let datastore handle all parameter formatting.
        if query_parameters is not None:
            for key, value in query_parameters.items():
                if key in query:
                    params[f"param_{key}"] = str(value)

        add_log_comment_param(params)

        async with self.session.get(url=self.url, headers=self.headers, params=params) as response:
            await self.acheck_response(response, query)
            yield response

    @contextlib.asynccontextmanager
    async def apost_query(
        self, query, *data, query_parameters, query_id, timeout: float | None = None
    ) -> collections.abc.AsyncIterator[aiohttp.ClientResponse]:
        """POST a query to the Datastore HTTP interface.

        The context manager protocol is used to control when to release the response.

        Query parameters will be formatted with string formatting and additionally sent to
        Datastore in the query string.

        Arguments:
            query: The query to POST.
            *data: Iterable of values to include in the body of the request. For example, the tuples of VALUES for an INSERT query.
            query_parameters: Parameters to be formatted in the query.
            query_id: A query ID to pass to Datastore.

        Returns:
            The response received from the Datastore HTTP interface.
        """
        if self.session is None:
            raise DatastoreClientNotConnected()

        params = {**self.params}
        if query_id is not None:
            params["query_id"] = query_id

        # Certain views, like person_batch_exports* still rely on us formatting arguments.
        query = self.prepare_query(query, query_parameters)

        # TODO: Let datastore handle all parameter formatting.
        if query_parameters is not None:
            for key, value in query_parameters.items():
                if key not in query:
                    continue

                if isinstance(value, list):
                    # Encode lists of strings in case they contain single quotes.
                    # This is intended only to handle `exclude_events` from batch
                    # exports. A further refactor of this whole block is pending.
                    params[f"param_{key}"] = encode_datastore_data(value).decode("utf-8")
                else:
                    params[f"param_{key}"] = str(value)
        add_log_comment_param(params)

        request_data = self.prepare_request_data(data)

        if request_data:
            params["query"] = query
        else:
            request_data = query.encode("utf-8")

        if timeout:
            client_timeout = aiohttp.ClientTimeout(total=timeout)
        else:
            client_timeout = None

        try:
            async with self.session.post(
                url=self.url, params=params, headers=self.headers, data=request_data, timeout=client_timeout
            ) as response:
                await self.acheck_response(response, query)
                yield response
        except TimeoutError:
            raise DatastoreClientTimeoutError(query, query_id)

    @contextlib.contextmanager
    def post_query(self, query, *data, query_parameters, query_id) -> collections.abc.Iterator:
        """POST a query to the Datastore HTTP interface.

        The context manager protocol is used to control when to release the response.

        Query parameters will be formatted with string formatting and additionally sent to
        Datastore in the query string.

        Arguments:
            query: The query to POST.
            *data: Iterable of values to include in the body of the request. For example, the tuples of VALUES for an INSERT query.
            query_parameters: Parameters to be formatted in the query.
            query_id: A query ID to pass to Datastore.

        Returns:
            The response received from the Datastore HTTP interface.
        """
        params = {**self.params}
        if query_id is not None:
            params["query_id"] = query_id

        query = self.prepare_query(query, query_parameters)
        request_data = self.prepare_request_data(data)

        if request_data:
            params["query"] = query
        else:
            request_data = query.encode("utf-8")

        # TODO: Let datastore handle all parameter formatting.
        if query_parameters is not None:
            for key, value in query_parameters.items():
                if key in query:
                    params[f"param_{key}"] = str(value)
        add_log_comment_param(params)

        with requests.Session() as s:
            response = s.post(
                url=self.url,
                params=params,
                headers=self.headers,
                data=request_data,
                stream=True,
                verify=False,
            )
            self.check_response(response, query)
            yield response

    async def execute_query(
        self, query, *data, query_parameters=None, query_id: str | None = None, timeout: float | None = None
    ) -> None:
        """Execute the given query in Datastore.

        This method doesn't return any response.
        """
        async with self.apost_query(
            query, *data, query_parameters=query_parameters, query_id=query_id, timeout=timeout
        ):
            return None

    async def read_query(self, query, query_parameters=None, query_id: str | None = None) -> bytes:
        """Execute the given readonly query in Datastore and read the response in full.

        As the entire payload will be read at once, use this method when expecting a small payload, like
        when running a 'count(*)' query.
        """
        async with self.aget_query(query, query_parameters=query_parameters, query_id=query_id) as response:
            return await response.content.read()

    async def read_query_as_jsonl(
        self, query, query_parameters=None, query_id: str | None = None
    ) -> list[dict[typing.Any, typing.Any]]:
        """Execute the given readonly query in Datastore and read the response as JSONL.

        This will return a list of Python dictionaries (each one a JSON document).

        NOTE: This method makes sense when running with FORMAT JSONEachRow, although we currently do not enforce this.
        If the query is expected to return a large amount of data, it is preferable to use stream_query_as_jsonl.
        """
        resp = await self.read_query(query, query_parameters=query_parameters, query_id=query_id)
        lines = resp.split(b"\n")
        return [json.loads(line) for line in lines if line]

    async def acheck_query(
        self,
        query_id: str,
        raise_on_error: bool = True,
    ) -> DatastoreQueryStatus:
        """Check the status of a query in Datastore.

        This method first checks the query log to see if the query has finished, failed, or is still running.
        If it's not found in the query log for whatever reason (we've seen this happen many times in production), it
        checks the process list to see if the query is still running.

        Arguments:
            query_id: The ID of the query to check.
            raise_on_error: Whether to raise an exception if the query has
                failed.

        Raises:
            DatastoreQueryNotFound: If the query is not found in the query log or process list.
            DatastoreCheckQueryStatusError: If an error occurs while checking the query status.
            DatastoreError: If raise_on_error is True and the query has failed.
        """
        try:
            return await self.acheck_query_in_query_log(query_id, raise_on_error=raise_on_error)
        except DatastoreQueryNotFound:
            is_running = await self.acheck_query_in_process_list(query_id)
            if is_running:
                return DatastoreQueryStatus.RUNNING
            else:
                self.logger.warning("Expected query not found in query log or process list", query_id=query_id)
                raise

    async def acheck_query_in_query_log(
        self,
        query_id: str,
        raise_on_error: bool = True,
    ) -> DatastoreQueryStatus:
        """Check the status of a query in the Datastore query log.

        Arguments:
            query_id: The ID of the query to check.
            raise_on_error: Whether to raise an exception if the query has
                failed.
        """
        query = """
                SELECT type, exception
                FROM clusterAllReplicas({{cluster_name:String}}, system.query_log)
                WHERE query_id = {{query_id:String}}
                    AND event_date >= yesterday() AND event_time >= now() - interval 24 hour
                FORMAT JSONEachRow
                """

        try:
            results = await self.read_query_as_jsonl(
                query,
                query_parameters={"query_id": query_id, "cluster_name": settings.DATASTORE_CLUSTER},
                query_id=f"{query_id}-CHECK-QUERY-LOG",
            )
        except DatastoreError as e:
            error_message = f"Error checking for query '{query_id}' in query log: {str(e)}"
            raise DatastoreCheckQueryStatusError(error_message, query_id=query_id) from e

        num_rows = len(results)
        if num_rows == 0:
            raise DatastoreQueryNotFound(query_id)

        events = set()
        error = None
        for row in results:
            if not row:
                continue

            # In some circumstances, Datastore returns errors as inside the query result, using a single "exception"
            # key, therefore, if this is the case, raise an error.
            if "type" not in row:
                error = row.get("exception", "Neither 'type' nor 'exception' keys found in result")
                error_message = f"Error checking for query '{query_id}' in query log: {error}"
                raise DatastoreCheckQueryStatusError(error_message, query_id=query_id)

            events.add(row["type"])

            error_value = row.get("exception", None)
            if error_value:
                error = error_value

        if "QueryFinish" in events:
            return DatastoreQueryStatus.FINISHED
        elif "ExceptionWhileProcessing" in events or "ExceptionBeforeStart" in events:
            if raise_on_error:
                error_message = error or f"Unknown query error in query with ID: {query_id}"
                # we don't have the original query here so just use the query id
                raise DatastoreError(error_message, query_id=query_id)

            return DatastoreQueryStatus.ERROR
        elif "QueryStart" in events:
            return DatastoreQueryStatus.RUNNING
        else:
            raise DatastoreQueryNotFound(query_id)

    async def acheck_query_in_process_list(self, query_id: str) -> bool:
        """Check if a query is running in the Datastore process list.

        Arguments:
            query_id: The ID of the query to check.

        Returns:
            True if the query is running, False otherwise.
        """
        query = """
                SELECT 1
                FROM clusterAllReplicas({{cluster_name:String}}, system.processes)
                WHERE query_id = {{query_id:String}}
                    AND NOT is_cancelled
                LIMIT 1
                """

        try:
            resp = await self.read_query(
                query,
                query_parameters={"query_id": query_id, "cluster_name": settings.DATASTORE_CLUSTER},
                query_id=f"{query_id}-CHECK-PROCESS-LIST",
            )
        except DatastoreError as e:
            error_message = f"Error checking for query '{query_id}' in process list: {str(e)}"
            raise DatastoreCheckQueryStatusError(error_message, query_id=query_id) from e

        if not resp:
            return False

        result = resp.decode("utf-8").strip()
        return result == "1"

    async def acancel_query(self, query_id: str) -> None:
        """Cancel a running query in Datastore.

        Arguments:
            query_id: The ID of the query to cancel.
        """
        query = f"KILL QUERY ON CLUSTER '{settings.DATASTORE_CLUSTER}' WHERE query_id = {{{{query_id:String}}}}"

        await self.execute_query(
            query,
            query_parameters={"query_id": query_id},
            query_id=f"{query_id}-KILL",
        )

        self.logger.info("Cancelled query", query_id=query_id)

    async def stream_query_as_jsonl(
        self,
        query,
        *data,
        query_parameters=None,
        query_id: str | None = None,
        line_separator=b"\n",
    ) -> typing.AsyncGenerator[dict[typing.Any, typing.Any], None]:
        """Execute the given query in Datastore and stream back the response as one JSON per line.

        This method makes sense when running with FORMAT JSONEachRow, although we currently do not enforce this.
        """

        buffer = b""
        async with self.apost_query(query, *data, query_parameters=query_parameters, query_id=query_id) as response:
            async for chunk in response.content.iter_any():
                buffer += chunk
                while line_separator in buffer:
                    line, buffer = buffer.split(line_separator, 1)
                    if line.strip():
                        yield json.loads(line)
            if buffer.strip():
                yield json.loads(buffer)

    def stream_query_as_arrow(
        self,
        query,
        *data,
        query_parameters=None,
        query_id: str | None = None,
    ) -> typing.Generator[pa.RecordBatch, None, None]:
        """Execute the given query in Datastore and stream back the response as Arrow record batches.

        This method makes sense when running with FORMAT ArrowStreaming, although we currently do not enforce this.
        As pyarrow doesn't support async/await buffers, this method is sync and utilizes requests instead of aiohttp.
        """
        with self.post_query(query, *data, query_parameters=query_parameters, query_id=query_id) as response:
            with pa.ipc.open_stream(pa.PythonFile(response.raw)) as reader:
                yield from reader

    async def astream_query_as_arrow(
        self,
        query,
        *data,
        query_parameters=None,
        query_id: str | None = None,
    ) -> typing.AsyncGenerator[pa.RecordBatch, None]:
        """Execute the given query in Datastore and stream back the response as Arrow record batches.

        This method makes sense when running with FORMAT ArrowStream, although we currently do not enforce this.
        """
        async with self.apost_query(query, *data, query_parameters=query_parameters, query_id=query_id) as response:
            reader = asyncpa.AsyncRecordBatchReader(ChunkBytesAsyncStreamIterator(response.content))
            async for batch in reader:
                yield batch

    async def aproduce_query_as_arrow_record_batches(
        self,
        query,
        *data,
        queue: asyncio.Queue,
        query_parameters=None,
        query_id: str | None = None,
    ) -> None:
        """Execute the given query in Datastore and produce Arrow record batches to given buffer queue.

        This method makes sense when running with FORMAT ArrowStream, although we currently do not enforce this.
        This method is intended to be ran as a background task, producing record batches continuously, while other
        downstream consumer tasks process them from the queue.
        """
        async with self.apost_query(query, *data, query_parameters=query_parameters, query_id=query_id) as response:
            reader = asyncpa.AsyncRecordBatchProducer(ChunkBytesAsyncStreamIterator(response.content))
            await reader.produce(queue=queue)

    async def __aenter__(self):
        """Enter method part of the AsyncContextManager protocol."""

        def socket_factory(addr_info):
            family, type_, proto, _, _ = addr_info
            sock = socket.socket(family=family, type=type_, proto=proto)
            # Enable keepalive in the socket
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, True)

            if sys.platform == "linux":
                # Start sending keepalive probes after 60s
                # Ensure that any idle timeouts allow at least 60s
                tcp_keepidle = 60
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, tcp_keepidle)
                # Send keepalive probes every 10s
                tcp_keepintvl = 10
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, tcp_keepintvl)
                # Give up after 5 failed probes
                tcp_keepcnt = 5
                sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, tcp_keepcnt)
                self.logger.debug(
                    "Configured keepalive probes",
                    tcp_keepidle=tcp_keepidle,
                    tcp_keepintvl=tcp_keepintvl,
                    tcp_keepcnt=tcp_keepcnt,
                )

            return sock

        self.connector = aiohttp.TCPConnector(ssl=self.ssl, socket_factory=socket_factory)
        self.session = aiohttp.ClientSession(connector=self.connector, timeout=self.timeout)
        return self

    async def __aexit__(self, exc_type, exc_value, tb):
        """Exit method part of the AsyncContextManager protocol."""
        if self.session is not None:
            await self.session.close()

        if self.connector is not None:
            await self.connector.close()

        self.session = None
        self.connector = None
        return False


@contextlib.asynccontextmanager
async def get_client(
    *, team_id: typing.Optional[int] = None, datastore_url: str | None = None, **kwargs
) -> collections.abc.AsyncIterator[DatastoreClient]:
    """
    Returns a Datastore client based on the aiochclient library. This is an
    async context manager.

    Usage:

        async with get_client() as client:
            await client.apost_query("SELECT 1")

    Note that this is not a connection pool, so you should not use this for
    queries that are run frequently.

    Note that we setup the SSL context here, allowing for custom CA certs to be
    used. I couldn't see a simply way to do this with `aiochclient` so we
    explicitly use `aiohttp` to create the client session with an ssl_context
    and pass that to `aiochclient`.
    """
    # Set up SSL context, roughly based on how `datastore_driver` does it.
    # TODO: figure out why this is not working when we set CERT_REQUIRED. We
    # include a custom CA cert in the Docker image and set the path to it in
    # the settings, but I can't get this to work as expected.
    #
    # ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    # ssl_context.verify_mode = ssl.CERT_REQUIRED if settings.DATASTORE_VERIFY else ssl.CERT_NONE
    # if ssl_context.verify_mode is ssl.CERT_REQUIRED:
    #    if settings.DATASTORE_CA:
    #        ssl_context.load_verify_locations(settings.DATASTORE_CA)
    #    elif ssl_context.verify_mode is ssl.CERT_REQUIRED:
    #        ssl_context.load_default_certs(ssl.Purpose.SERVER_AUTH)
    timeout = aiohttp.ClientTimeout(total=None, connect=None, sock_connect=30, sock_read=None)

    if team_id is None:
        default_max_block_size = settings.DATASTORE_MAX_BLOCK_SIZE_DEFAULT
    else:
        default_max_block_size = settings.DATASTORE_MAX_BLOCK_SIZE_OVERRIDES.get(
            team_id, settings.DATASTORE_MAX_BLOCK_SIZE_DEFAULT
        )
    max_block_size = kwargs.pop("max_block_size", None) or default_max_block_size
    http_send_timeout = kwargs.pop("http_send_timeout", 0)

    if datastore_url is None:
        url = settings.DATASTORE_OFFLINE_HTTP_URL
    else:
        url = datastore_url

    async with DatastoreClient(
        url=url,
        user=settings.DATASTORE_USER,
        password=settings.DATASTORE_PASSWORD,
        database=settings.DATASTORE_DATABASE,
        timeout=timeout,
        ssl=False,
        max_execution_time=settings.DATASTORE_MAX_EXECUTION_TIME,
        max_memory_usage=settings.DATASTORE_MAX_MEMORY_USAGE,
        max_block_size=max_block_size,
        cancel_http_readonly_queries_on_client_close=1,
        output_format_arrow_string_as_string="true",
        http_send_timeout=http_send_timeout,
        **kwargs,
    ) as client:
        yield client
