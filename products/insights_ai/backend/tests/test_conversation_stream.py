"""The assistant's reply is an SSE stream, and the slot it holds must always come back.

`create()` takes a reply slot, then hangs `permit.release` on the response's
resource closers so Django returns the slot whenever the response finishes —
including when the client never reads a byte. That only holds if EVERY object
`_stream` can return runs its closers, and it has two shapes: the event stream,
and a plain 503 once the process is at its SSE cap. If the 503 shape ever stopped
running them, each rejected chat would strand a slot for the life of the process
and the assistant would wedge on "busy" with nothing generating.
"""

from collections.abc import Iterator
from http import HTTPStatus

from unittest import mock

from django.http import StreamingHttpResponse
from django.test import override_settings

from products.insights_ai.backend.api.conversations import ConversationViewSet


def _chunks() -> Iterator[bytes]:
    yield b"data: hello\n\n"


def _stream(chunks):
    """`_stream` reads nothing off self, so it needs no request, team or database."""
    return ConversationViewSet._stream(None, chunks)


class TestConversationStream:
    def test_serves_an_event_stream_a_proxy_will_not_buffer(self):
        response = _stream(_chunks())

        assert isinstance(response, StreamingHttpResponse)
        assert response.status_code == HTTPStatus.OK
        assert response["Content-Type"] == "text/event-stream"
        # Without this a proxy holds the reply until it completes, which is the
        # whole point of streaming lost at the last hop.
        assert response["X-Accel-Buffering"] == "no"
        assert "no-cache" in response["Cache-Control"]

    def test_releases_the_request_connection_before_the_first_chunk(self):
        """Insights runs CONN_MAX_AGE = 0, so a connection still open when the
        stream opens stays pinned to a pgbouncer slot until the stream ends. An
        assistant reply runs for minutes, so leaving it open costs one pooled
        connection per concurrent chat."""
        idle = mock.Mock(in_atomic_block=False)
        with mock.patch("insights.api.streaming.connections") as connections:
            connections.all.return_value = [idle]
            _stream(_chunks())

        idle.close.assert_called_once()

    def test_returns_the_reply_slot_when_the_stream_is_never_read(self):
        released = []
        response = _stream(_chunks())
        response._resource_closers.append(lambda: released.append("slot"))

        response.close()

        assert released == ["slot"]

    def test_returns_the_reply_slot_when_the_process_is_at_its_stream_cap(self):
        released = []
        with override_settings(SSE_MAX_CONCURRENT_STREAMS_PER_PROCESS=0):
            response = _stream(_chunks())

        assert response.status_code == HTTPStatus.SERVICE_UNAVAILABLE
        # The rejection is a plain HttpResponse, not a stream — `create()` hangs
        # the slot's release on it just the same, so it has to honour closers.
        response._resource_closers.append(lambda: released.append("slot"))
        response.close()

        assert released == ["slot"]
