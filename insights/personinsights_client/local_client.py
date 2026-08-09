"""ORM-backed personinsights client.

personinsights is a read-through accelerator in front of the same Postgres this
app already talks to — its own bulk reads run against "a replica's 5-connection
bulk Postgres pool" (see ``insights/models/person/util.py``).  It is not the owner
of persons, groups or group-type mappings: those rows live in
``insights_person``, ``insights_persondistinctid``, ``insights_group``,
``insights_grouptypemapping`` and friends, which the Django ORM already maps.

A deployment that does not run the service therefore still has all of the data,
and ``PersonDBRouter`` never routes elsewhere — it returns ``None`` and lets the
default database stand.  So this client answers the same proto requests straight
from the ORM.

It presents the same call interface as ``PersonHogClient``: every method takes the
proto request and returns the proto response, built from the real proto message
classes.  Call sites are identical either way, which is the whole point — the
seam in ``client.py`` absorbs the difference and no caller changes.

Two ``ReadOptions`` knobs are answered rather than implemented, because locally
they are meaningless:

* ``consistency`` — there is one database, so every read is already STRONG.
  Serving a STRONG read to an EVENTUAL request is strictly stronger than asked.
* ``field_mask`` — a projection hint.  All fields are returned, which the proto
  documents as the backward-compatible default.

Deletes go through a plain SQL DELETE rather than ``QuerySet.delete()``: the
service deletes rows in SQL, and ``QuerySet.delete()`` would additionally run
Django's cascade collection and per-row signals (``CohortPeople`` has a
``post_delete`` receiver that recomputes a cohort's size on every row).
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from django.db import transaction
from django.db.models import Count, F, Q, QuerySet, TextField
from django.db.models.functions import Cast

from insights.models.group.group import Group
from insights.models.group_type_mapping import GroupTypeMapping
from insights.models.person import Person, PersonDistinctId
from insights.models.person.missing_person import uuidFromDistinctId
from insights.models.person.person import PersonlessDistinctId
from insights.personinsights_client.proto.generated.personinsights.types.v1 import (
    cohort_pb2,
    feature_flag_pb2,
    group_pb2,
    person_pb2,
)
from insights.utils import is_anonymous_id

# Columns each proto message is built from.  Kept next to their builder so the
# query and the mapping can never drift apart.
_PERSON_FIELDS = (
    "id",
    "uuid",
    "team_id",
    "properties",
    "properties_last_updated_at",
    "properties_last_operation",
    "created_at",
    "version",
    "is_identified",
    "is_user",
    "last_seen_at",
)

_GROUP_FIELDS = (
    "id",
    "team_id",
    "group_type_index",
    "group_key",
    "group_properties",
    "created_at",
    "properties_last_updated_at",
    "properties_last_operation",
    "version",
)

_MAPPING_FIELDS = (
    "id",
    "team_id",
    "project_id",
    "group_type",
    "group_type_index",
    "name_singular",
    "name_plural",
    "default_columns",
    "detail_dashboard_id",
    "created_at",
)

# The service bumps a split person and its distinct_id by this much so the new
# version outranks a delete (which uses +100).  See insights/models/person/person.py.
_SPLIT_VERSION_BUMP = 101


def _ms(value: datetime | None) -> int:
    """Epoch milliseconds, the proto's time unit.  Absent reads as 0."""
    return int(value.timestamp() * 1000) if value else 0


def _at(milliseconds: int | None) -> datetime | None:
    return datetime.fromtimestamp(milliseconds / 1000, tz=UTC) if milliseconds else None


def _encode(value: Any) -> bytes:
    """JSON columns cross the wire as bytes.  Absent reads as empty."""
    return json.dumps(value).encode() if value is not None else b""


def _decode(raw: bytes) -> Any:
    return json.loads(raw) if raw else None


def _uuid(value: str) -> UUID | None:
    """Parse a wire UUID.  An unparseable one cannot name a stored row, so it is
    a miss rather than an error."""
    try:
        return UUID(value)
    except (AttributeError, ValueError):
        return None


def _person(row: dict[str, Any]) -> person_pb2.Person:
    person = person_pb2.Person(
        id=row["id"],
        uuid=str(row["uuid"]) if row["uuid"] else "",
        team_id=row["team_id"],
        properties=_encode(row["properties"] or {}),
        properties_last_updated_at=_encode(row["properties_last_updated_at"]),
        properties_last_operation=_encode(row["properties_last_operation"]),
        created_at=_ms(row["created_at"]),
        version=row["version"] or 0,
        is_identified=row["is_identified"],
        last_seen_at=_ms(row["last_seen_at"]),
    )
    # is_user is an integer column (db_column="is_user_id") behind a bool field;
    # only its presence is meaningful on the wire.
    if row["is_user"] is not None:
        person.is_user_id = bool(row["is_user"])
    return person


def _group(row: dict[str, Any]) -> group_pb2.Group:
    return group_pb2.Group(
        id=row["id"],
        team_id=row["team_id"],
        group_type_index=row["group_type_index"],
        group_key=row["group_key"],
        group_properties=_encode(row["group_properties"] or {}),
        created_at=_ms(row["created_at"]),
        properties_last_updated_at=_encode(row["properties_last_updated_at"]),
        properties_last_operation=_encode(row["properties_last_operation"]),
        version=row["version"] or 0,
    )


def _mapping(row: dict[str, Any]) -> group_pb2.GroupTypeMapping:
    mapping = group_pb2.GroupTypeMapping(
        id=row["id"],
        team_id=row["team_id"],
        project_id=row["project_id"],
        group_type=row["group_type"],
        group_type_index=row["group_type_index"],
        name_singular=row["name_singular"] or "",
        name_plural=row["name_plural"] or "",
        created_at=_ms(row["created_at"]),
    )
    if row["default_columns"] is not None:
        mapping.default_columns = _encode(row["default_columns"])
    if row["detail_dashboard_id"] is not None:
        mapping.detail_dashboard_id = row["detail_dashboard_id"]
    return mapping


def _identified_first(
    distinct_ids: list[person_pb2.DistinctIdWithVersion],
) -> list[person_pb2.DistinctIdWithVersion]:
    """Order anonymous-shaped ids last, the way the replica does before applying a
    LIMIT, so identified ids survive the cut."""
    return sorted(distinct_ids, key=lambda d: is_anonymous_id(d.distinct_id))


def _distinct_id(distinct_id: str, version: int | None) -> person_pb2.DistinctIdWithVersion:
    return person_pb2.DistinctIdWithVersion(distinct_id=distinct_id, version=version or 0)


def _delete(rows: QuerySet, batch_size: int | None = None) -> int:
    """Delete up to ``batch_size`` rows and report how many went.

    A plain SQL DELETE, like the service does.  ``QuerySet.delete()`` would first
    load every row to run cascade collection and per-row signals, which the
    service never does and which turns a bulk delete into thousands of queries.
    """
    ids = rows.order_by("pk").values_list("pk", flat=True)
    doomed = list(ids[:batch_size] if batch_size else ids)
    if not doomed:
        return 0
    # Filter off the caller's queryset, not the bare manager, so its team scope
    # (and the partition pruning that comes with it) is preserved.
    rows.filter(pk__in=doomed)._raw_delete(rows.db)
    return len(doomed)


class LocalClient:
    """Serves the personinsights interface from the ORM.

    Same method names, request types and response types as ``PersonHogClient``.
    ``timeout`` arguments are accepted and ignored: there is no RPC to bound.
    """

    def close(self) -> None:
        pass

    # -- Person reads --

    def _persons(self, team_id: int, **filters: Any) -> QuerySet:
        return Person.objects.filter(team_id=team_id, is_deleted=False, **filters).values(*_PERSON_FIELDS)

    def get_person(self, request: person_pb2.GetPersonRequest) -> person_pb2.GetPersonResponse:
        row = self._persons(request.team_id, id=request.person_id).first()
        return person_pb2.GetPersonResponse(person=_person(row) if row else None)

    def get_persons(self, request: person_pb2.GetPersonsRequest) -> person_pb2.PersonsResponse:
        wanted = list(request.person_ids)
        found = {row["id"]: row for row in self._persons(request.team_id, id__in=wanted)}
        return person_pb2.PersonsResponse(
            persons=[_person(found[person_id]) for person_id in wanted if person_id in found],
            missing_ids=[person_id for person_id in wanted if person_id not in found],
        )

    def get_person_by_uuid(self, request: person_pb2.GetPersonByUuidRequest) -> person_pb2.GetPersonResponse:
        uuid = _uuid(request.uuid)
        row = self._persons(request.team_id, uuid=uuid).first() if uuid else None
        return person_pb2.GetPersonResponse(person=_person(row) if row else None)

    def get_persons_by_uuids(self, request: person_pb2.GetPersonsByUuidsRequest) -> person_pb2.PersonsResponse:
        wanted = [_uuid(value) for value in request.uuids]
        found = {row["uuid"]: row for row in self._persons(request.team_id, uuid__in=[u for u in wanted if u])}
        # missing_ids holds person ids, which an unresolved uuid does not have,
        # so a miss is simply absent from the response — as it is on the wire.
        return person_pb2.PersonsResponse(persons=[_person(found[uuid]) for uuid in wanted if uuid in found])

    # -- Person reads by distinct ID --

    def _person_ids_for(self, team_id: int, distinct_ids: list[str]) -> dict[str, int]:
        rows = PersonDistinctId.objects.filter(
            team_id=team_id, distinct_id__in=distinct_ids, is_deleted=False
        ).values_list("distinct_id", "person_id")
        return dict(rows)

    def get_person_by_distinct_id(
        self, request: person_pb2.GetPersonByDistinctIdRequest
    ) -> person_pb2.GetPersonResponse:
        owner = self._person_ids_for(request.team_id, [request.distinct_id]).get(request.distinct_id)
        row = self._persons(request.team_id, id=owner).first() if owner else None
        return person_pb2.GetPersonResponse(person=_person(row) if row else None)

    def get_persons_by_distinct_ids_in_team(
        self, request: person_pb2.GetPersonsByDistinctIdsInTeamRequest
    ) -> person_pb2.PersonsByDistinctIdsInTeamResponse:
        wanted = list(request.distinct_ids)
        owners = self._person_ids_for(request.team_id, wanted)
        found = {row["id"]: row for row in self._persons(request.team_id, id__in=set(owners.values()))}
        # One result per requested distinct_id that resolves, in request order.
        # The wire contract does not deduplicate by person; callers that need
        # unique persons do that themselves.
        return person_pb2.PersonsByDistinctIdsInTeamResponse(
            results=[
                person_pb2.PersonWithDistinctIds(distinct_id=distinct_id, person=_person(found[owners[distinct_id]]))
                for distinct_id in wanted
                if distinct_id in owners and owners[distinct_id] in found
            ]
        )

    # -- Distinct ID reads --

    def get_distinct_ids_for_person(
        self, request: person_pb2.GetDistinctIdsForPersonRequest
    ) -> person_pb2.GetDistinctIdsForPersonResponse:
        rows = PersonDistinctId.objects.filter(
            team_id=request.team_id, person_id=request.person_id, is_deleted=False
        ).values_list("distinct_id", "version")
        distinct_ids = [_distinct_id(distinct_id, version) for distinct_id, version in rows]

        limit = request.limit if request.HasField("limit") and request.limit > 0 else None
        if limit is not None:
            distinct_ids = _identified_first(distinct_ids)[:limit]
        return person_pb2.GetDistinctIdsForPersonResponse(distinct_ids=distinct_ids)

    def get_distinct_ids_for_persons(
        self, request: person_pb2.GetDistinctIdsForPersonsRequest
    ) -> person_pb2.GetDistinctIdsForPersonsResponse:
        wanted = list(request.person_ids)
        limit = (
            request.limit_per_person if request.HasField("limit_per_person") and request.limit_per_person > 0 else None
        )

        # One query for the whole batch, grouped in memory: a per-person LIMIT in
        # SQL would need a window function, and the ordering below is applied to
        # the full set anyway.
        by_person: dict[int, list[person_pb2.DistinctIdWithVersion]] = {person_id: [] for person_id in wanted}
        rows = PersonDistinctId.objects.filter(
            team_id=request.team_id, person_id__in=wanted, is_deleted=False
        ).values_list("person_id", "distinct_id", "version")
        for person_id, distinct_id, version in rows:
            by_person[person_id].append(_distinct_id(distinct_id, version))

        results = []
        for person_id in wanted:
            distinct_ids = by_person[person_id]
            if limit is not None:
                distinct_ids = _identified_first(distinct_ids)[:limit]
            results.append(person_pb2.PersonDistinctIds(person_id=person_id, distinct_ids=distinct_ids))
        return person_pb2.GetDistinctIdsForPersonsResponse(person_distinct_ids=results)

    # -- Person writes --

    def delete_persons(
        self, request: person_pb2.DeletePersonsRequest, timeout: float | None = None
    ) -> person_pb2.DeletePersonsResponse:
        uuids = [uuid for uuid in (_uuid(value) for value in request.person_uuids) if uuid]
        # Team deletion is a hard delete, so soft-deleted rows go too — leaving
        # them would strand rows the caller's loop can never drain.
        doomed = Person.objects.filter(team_id=request.team_id, uuid__in=uuids)
        return person_pb2.DeletePersonsResponse(deleted_count=self._delete_persons(doomed))

    def delete_persons_batch_for_team(
        self, request: person_pb2.DeletePersonsBatchForTeamRequest, timeout: float | None = None
    ) -> person_pb2.DeletePersonsBatchForTeamResponse:
        doomed = Person.objects.filter(team_id=request.team_id)
        return person_pb2.DeletePersonsBatchForTeamResponse(
            deleted_count=self._delete_persons(doomed, request.batch_size)
        )

    @staticmethod
    def _delete_persons(persons: QuerySet, batch_size: int | None = None) -> int:
        """Delete persons and the distinct_id rows that point at them.

        The FK is NO ACTION in the database, so the child rows are this client's
        job — exactly as the RPC documents.
        """
        ids = persons.order_by("pk").values_list("pk", flat=True)
        doomed = list(ids[:batch_size] if batch_size else ids)
        if not doomed:
            return 0
        with transaction.atomic():
            _delete(PersonDistinctId.objects.filter(person_id__in=doomed))
            _delete(persons.filter(pk__in=doomed))
        return len(doomed)

    def delete_personless_distinct_ids_batch_for_team(
        self,
        request: person_pb2.DeletePersonlessDistinctIdsBatchForTeamRequest,
        timeout: float | None = None,
    ) -> person_pb2.DeletePersonlessDistinctIdsBatchForTeamResponse:
        return person_pb2.DeletePersonlessDistinctIdsBatchForTeamResponse(
            deleted_count=_delete(
                PersonlessDistinctId.objects.filter(team_id=request.team_id), request.batch_size
            )
        )

    def split_person(
        self, request: person_pb2.SplitPersonRequest, timeout: float | None = None
    ) -> person_pb2.SplitPersonResponse:
        """Split distinct_ids off a person onto new persons, one per distinct_id.

        Each new person gets the deterministic UUIDv5 of (team_id, distinct_id),
        which is what makes the operation idempotent: re-splitting lands on the
        same person and keeps its original created_at.  Atomic per request.
        """
        with transaction.atomic():
            source = self._persons(request.team_id, id=request.person_id).first()
            if source is None:
                raise Person.DoesNotExist(
                    f"person_id={request.person_id} not found (team_id={request.team_id})"
                )

            owned = dict(
                PersonDistinctId.objects.filter(
                    team_id=request.team_id, person_id=request.person_id, is_deleted=False
                ).values_list("distinct_id", "version")
            )
            unknown = [d for d in request.distinct_ids_to_split if d not in owned]
            if unknown:
                raise ValueError(
                    f"distinct_ids {unknown} do not belong to person_id={request.person_id} "
                    f"(team_id={request.team_id})"
                )

            person_version = (source["version"] or 0) + _SPLIT_VERSION_BUMP
            splits = []
            for distinct_id in request.distinct_ids_to_split:
                uuid = uuidFromDistinctId(request.team_id, distinct_id)

                existing = Person.objects.filter(team_id=request.team_id, uuid=uuid).values("id", "created_at").first()
                if existing:
                    Person.objects.filter(team_id=request.team_id, id=existing["id"]).update(version=person_version)
                    person_id, created_at = existing["id"], existing["created_at"]
                else:
                    created = Person.objects.create(
                        team_id=request.team_id, uuid=uuid, version=person_version, properties={}
                    )
                    person_id, created_at = created.pk, created.created_at

                distinct_id_version = (owned[distinct_id] or 0) + _SPLIT_VERSION_BUMP
                PersonDistinctId.objects.filter(team_id=request.team_id, distinct_id=distinct_id).update(
                    person_id=person_id, version=distinct_id_version
                )
                splits.append(
                    person_pb2.SplitResult(
                        distinct_id=distinct_id,
                        new_person_uuid=str(uuid),
                        new_person_version=person_version,
                        pdi_version=distinct_id_version,
                        new_person_created_at_ms=_ms(created_at),
                    )
                )
        return person_pb2.SplitPersonResponse(splits=splits)

    # -- Undelete repair --
    #
    # Both floors are guarded: the row is written only when its stored version is
    # below the floor, so a version is never lowered.  A NULL version is left
    # alone, matching `WHERE version < min_version`.

    def set_person_version_floor(
        self, request: person_pb2.SetPersonVersionFloorRequest, timeout: float | None = None
    ) -> person_pb2.SetPersonVersionFloorResponse:
        updated = Person.objects.filter(
            team_id=request.team_id, id=request.person_id, version__lt=request.min_version
        ).update(version=request.min_version)
        return person_pb2.SetPersonVersionFloorResponse(updated=bool(updated))

    def set_person_distinct_id_version_floor(
        self, request: person_pb2.SetPersonDistinctIdVersionFloorRequest, timeout: float | None = None
    ) -> person_pb2.SetPersonDistinctIdVersionFloorResponse:
        rows = PersonDistinctId.objects.filter(
            team_id=request.team_id, distinct_id=request.distinct_id, is_deleted=False
        )
        owner = rows.values_list("person_id", flat=True).first()
        if owner is None:
            # The distinct_id has not been re-used yet; the person field stays absent.
            return person_pb2.SetPersonDistinctIdVersionFloorResponse()

        rows.filter(version__lt=request.min_version).update(version=request.min_version)

        # The person is returned whenever the distinct_id exists, even if the
        # guard left the version unchanged.
        row = self._persons(request.team_id, id=owner).first()
        return person_pb2.SetPersonDistinctIdVersionFloorResponse(person=_person(row) if row else None)

    # -- Groups --

    def _groups(self, **filters: Any) -> QuerySet:
        return Group.objects.filter(**filters).values(*_GROUP_FIELDS)

    def get_group(self, request: group_pb2.GetGroupRequest) -> group_pb2.GetGroupResponse:
        row = self._groups(
            team_id=request.team_id,
            group_type_index=request.group_type_index,
            group_key=request.group_key,
        ).first()
        return group_pb2.GetGroupResponse(group=_group(row) if row else None)

    def get_groups(self, request: group_pb2.GetGroupsRequest) -> group_pb2.GroupsResponse:
        wanted = list(request.group_identifiers)
        if not wanted:
            return group_pb2.GroupsResponse()

        match = Q()
        for identifier in wanted:
            match |= Q(group_type_index=identifier.group_type_index, group_key=identifier.group_key)
        found = {
            (row["group_type_index"], row["group_key"]): row for row in self._groups(team_id=request.team_id).filter(match)
        }

        keyed = [(identifier, found.get((identifier.group_type_index, identifier.group_key))) for identifier in wanted]
        return group_pb2.GroupsResponse(
            groups=[_group(row) for _, row in keyed if row],
            missing_groups=[identifier for identifier, row in keyed if row is None],
        )

    def get_groups_batch(self, request: group_pb2.GetGroupsBatchRequest) -> group_pb2.GetGroupsBatchResponse:
        wanted = list(request.keys)
        if not wanted:
            return group_pb2.GetGroupsBatchResponse()

        # Each key carries its own team_id, so the scope is per key.
        match = Q()
        for key in wanted:
            match |= Q(team_id=key.team_id, group_type_index=key.group_type_index, group_key=key.group_key)
        found = {
            (row["team_id"], row["group_type_index"], row["group_key"]): row for row in self._groups().filter(match)
        }

        return group_pb2.GetGroupsBatchResponse(
            results=[
                group_pb2.GroupWithKey(key=key, group=_group(found[identity]))
                for key in wanted
                if (identity := (key.team_id, key.group_type_index, key.group_key)) in found
            ]
        )

    def list_groups(self, request: group_pb2.ListGroupsRequest) -> group_pb2.ListGroupsResponse:
        rows = self._groups(team_id=request.team_id, group_type_index=request.group_type_index)

        if request.group_key_contains:
            rows = rows.filter(group_key__icontains=request.group_key_contains)
        if request.search:
            rows = rows.annotate(properties_text=Cast("group_properties", TextField())).filter(
                Q(properties_text__icontains=request.search) | Q(group_key=request.search)
            )

        cursor_created_at = _at(request.cursor_created_at_ms)
        if cursor_created_at:
            # Keyset on the sort key: strictly older, or same instant and lower id.
            rows = rows.filter(
                Q(created_at__lt=cursor_created_at)
                | Q(created_at=cursor_created_at, id__lt=request.cursor_id)
            )

        limit = request.limit if request.limit > 0 else 100
        page = list(rows.order_by("-created_at", "-id")[: limit + 1])
        return group_pb2.ListGroupsResponse(
            groups=[_group(row) for row in page[:limit]],
            has_more=len(page) > limit,
        )

    def create_group(self, request: group_pb2.CreateGroupRequest) -> group_pb2.CreateGroupResponse:
        created = Group.objects.create(
            team_id=request.team_id,
            group_type_index=request.group_type_index,
            group_key=request.group_key,
            group_properties=_decode(request.group_properties) or {},
            version=0,
        )
        created_at = _at(request.created_at) if request.HasField("created_at") else None
        if created_at:
            # created_at is auto_now_add, so the caller's timestamp has to be
            # written past the field's own pre-save.
            Group.objects.filter(pk=created.pk).update(created_at=created_at)

        row = self._groups(pk=created.pk).first()
        return group_pb2.CreateGroupResponse(group=_group(row) if row else None)

    def update_group(self, request: group_pb2.UpdateGroupRequest) -> group_pb2.UpdateGroupResponse:
        rows = Group.objects.filter(
            team_id=request.team_id,
            group_type_index=request.group_type_index,
            group_key=request.group_key,
        )

        # version is always auto-incremented on any update.
        changes: dict[str, Any] = {"version": F("version") + 1}
        for field in request.update_mask:
            if field == "group_properties":
                changes["group_properties"] = _decode(request.group_properties) or {}
            elif field == "properties_last_updated_at":
                changes["properties_last_updated_at"] = _decode(request.properties_last_updated_at) or {}
            elif field == "properties_last_operation":
                changes["properties_last_operation"] = _decode(request.properties_last_operation) or {}
            elif field == "created_at":
                changes["created_at"] = _at(request.created_at)

        updated = rows.update(**changes)
        row = self._groups(pk__in=rows.values_list("pk", flat=True)).first()
        if row is None:
            raise Group.DoesNotExist(
                f"group not found: team_id={request.team_id}, "
                f"group_type_index={request.group_type_index}, group_key={request.group_key}"
            )
        return group_pb2.UpdateGroupResponse(group=_group(row), updated=bool(updated))

    def delete_groups_batch_for_team(
        self, request: group_pb2.DeleteGroupsBatchForTeamRequest, timeout: float | None = None
    ) -> group_pb2.DeleteGroupsBatchForTeamResponse:
        return group_pb2.DeleteGroupsBatchForTeamResponse(
            deleted_count=_delete(Group.objects.filter(team_id=request.team_id), request.batch_size)
        )

    # -- Group type mappings --

    def _mappings(self, **filters: Any) -> QuerySet:
        return GroupTypeMapping.objects.filter(**filters).values(*_MAPPING_FIELDS)

    def get_group_type_mappings_by_team_id(
        self, request: group_pb2.GetGroupTypeMappingsByTeamIdRequest
    ) -> group_pb2.GroupTypeMappingsResponse:
        return group_pb2.GroupTypeMappingsResponse(
            mappings=[_mapping(row) for row in self._mappings(team_id=request.team_id)]
        )

    def get_group_type_mappings_by_project_id(
        self, request: group_pb2.GetGroupTypeMappingsByProjectIdRequest
    ) -> group_pb2.GroupTypeMappingsResponse:
        return group_pb2.GroupTypeMappingsResponse(
            mappings=[_mapping(row) for row in self._mappings(project_id=request.project_id)]
        )

    def get_group_type_mappings_by_team_ids(
        self, request: group_pb2.GetGroupTypeMappingsByTeamIdsRequest
    ) -> group_pb2.GroupTypeMappingsBatchResponse:
        return self._mappings_by("team_id", list(request.team_ids))

    def get_group_type_mappings_by_project_ids(
        self, request: group_pb2.GetGroupTypeMappingsByProjectIdsRequest
    ) -> group_pb2.GroupTypeMappingsBatchResponse:
        return self._mappings_by("project_id", list(request.project_ids))

    def _mappings_by(self, column: str, keys: list[int]) -> group_pb2.GroupTypeMappingsBatchResponse:
        grouped: dict[int, list[group_pb2.GroupTypeMapping]] = {key: [] for key in keys}
        for row in self._mappings(**{f"{column}__in": keys}):
            grouped[row[column]].append(_mapping(row))
        # One entry per requested key, empty ones included.
        return group_pb2.GroupTypeMappingsBatchResponse(
            results=[group_pb2.GroupTypeMappingsByKey(key=key, mappings=grouped[key]) for key in keys]
        )

    def get_group_type_mapping_by_dashboard_id(
        self, request: group_pb2.GetGroupTypeMappingByDashboardIdRequest
    ) -> group_pb2.GetGroupTypeMappingByDashboardIdResponse:
        row = self._mappings(team_id=request.team_id, detail_dashboard_id=request.dashboard_id).first()
        return group_pb2.GetGroupTypeMappingByDashboardIdResponse(mapping=_mapping(row) if row else None)

    def count_group_type_mappings(
        self, request: group_pb2.CountGroupTypeMappingsRequest
    ) -> group_pb2.CountGroupTypeMappingsResponse:
        counts = GroupTypeMapping.objects.values("team_id").annotate(total=Count("id")).order_by("team_id")
        return group_pb2.CountGroupTypeMappingsResponse(
            counts=[
                group_pb2.GroupTypeMappingCount(team_id=row["team_id"], count=row["total"]) for row in counts
            ]
        )

    def update_group_type_mapping(
        self, request: group_pb2.UpdateGroupTypeMappingRequest
    ) -> group_pb2.UpdateGroupTypeMappingResponse:
        rows = GroupTypeMapping.objects.filter(
            project_id=request.project_id, group_type_index=request.group_type_index
        )

        # A field named in the mask but absent from the request clears the column
        # — that is how a detail dashboard is unset.
        changes: dict[str, Any] = {}
        for field in request.update_mask:
            if field == "name_singular":
                changes["name_singular"] = request.name_singular or None
            elif field == "name_plural":
                changes["name_plural"] = request.name_plural or None
            elif field == "detail_dashboard_id":
                changes["detail_dashboard_id"] = (
                    request.detail_dashboard_id if request.HasField("detail_dashboard_id") else None
                )
            elif field == "default_columns":
                changes["default_columns"] = _decode(request.default_columns)
        if changes:
            rows.update(**changes)

        row = self._mappings(pk__in=rows.values_list("pk", flat=True)).first()
        if row is None:
            raise GroupTypeMapping.DoesNotExist(
                f"group type mapping not found: project_id={request.project_id}, "
                f"group_type_index={request.group_type_index}"
            )
        return group_pb2.UpdateGroupTypeMappingResponse(mapping=_mapping(row))

    def delete_group_type_mapping(
        self, request: group_pb2.DeleteGroupTypeMappingRequest
    ) -> group_pb2.DeleteGroupTypeMappingResponse:
        deleted = _delete(
            GroupTypeMapping.objects.filter(
                project_id=request.project_id, group_type_index=request.group_type_index
            )
        )
        return group_pb2.DeleteGroupTypeMappingResponse(deleted=bool(deleted))

    def delete_group_type_mappings_batch_for_team(
        self, request: group_pb2.DeleteGroupTypeMappingsBatchForTeamRequest, timeout: float | None = None
    ) -> group_pb2.DeleteGroupTypeMappingsBatchForTeamResponse:
        return group_pb2.DeleteGroupTypeMappingsBatchForTeamResponse(
            deleted_count=_delete(GroupTypeMapping.objects.filter(team_id=request.team_id), request.batch_size)
        )

    # -- Cohort membership --
    #
    # insights_cohortpeople has no team_id column, so the caller owns team-level
    # isolation here — the same contract the RPCs document.

    @staticmethod
    def _cohort_members() -> QuerySet:
        from products.cohorts.backend.models.cohort import CohortPeople

        return CohortPeople.objects.all()

    def check_cohort_membership(
        self, request: cohort_pb2.CheckCohortMembershipRequest
    ) -> cohort_pb2.CohortMembershipResponse:
        member_of = (
            self._cohort_members()
            .filter(person_id=request.person_id, cohort_id__in=list(request.cohort_ids))
            .values_list("cohort_id", flat=True)
            .distinct()
        )
        # Cohorts the person is not in are simply absent; callers read a missing
        # entry as False.
        return cohort_pb2.CohortMembershipResponse(
            memberships=[cohort_pb2.CohortMembership(cohort_id=cohort_id, is_member=True) for cohort_id in member_of]
        )

    def count_cohort_members(
        self, request: cohort_pb2.CountCohortMembersRequest
    ) -> cohort_pb2.CountCohortMembersResponse:
        return cohort_pb2.CountCohortMembersResponse(
            count=self._cohort_members().filter(cohort_id__in=list(request.cohort_ids)).count()
        )

    def list_cohort_member_ids(
        self, request: cohort_pb2.ListCohortMemberIdsRequest
    ) -> cohort_pb2.ListCohortMemberIdsResponse:
        rows = self._cohort_members().filter(cohort_id=request.cohort_id)
        if request.cursor > 0:
            rows = rows.filter(person_id__gt=request.cursor)

        limit = request.limit if request.limit > 0 else 10000
        page = list(rows.order_by("person_id").values_list("person_id", flat=True).distinct()[: limit + 1])
        has_more = len(page) > limit
        page = page[:limit]
        return cohort_pb2.ListCohortMemberIdsResponse(
            person_ids=page,
            next_cursor=page[-1] if has_more else 0,
        )

    def insert_cohort_members(
        self, request: cohort_pb2.InsertCohortMembersRequest, timeout: float | None = None
    ) -> cohort_pb2.InsertCohortMembersResponse:
        from products.cohorts.backend.models.cohort import CohortPeople

        wanted = list(request.person_ids)
        already = set(
            self._cohort_members()
            .filter(cohort_id=request.cohort_id, person_id__in=wanted)
            .values_list("person_id", flat=True)
        )
        version = request.version if request.HasField("version") else None
        rows = [
            CohortPeople(cohort_id=request.cohort_id, person_id=person_id, version=version)
            for person_id in dict.fromkeys(wanted)
            if person_id not in already
        ]
        CohortPeople.objects.bulk_create(rows)
        return cohort_pb2.InsertCohortMembersResponse(inserted_count=len(rows))

    def delete_cohort_member(
        self, request: cohort_pb2.DeleteCohortMemberRequest, timeout: float | None = None
    ) -> cohort_pb2.DeleteCohortMemberResponse:
        deleted = _delete(
            self._cohort_members().filter(cohort_id=request.cohort_id, person_id=request.person_id)
        )
        return cohort_pb2.DeleteCohortMemberResponse(deleted=bool(deleted))

    def delete_cohort_members_bulk(
        self, request: cohort_pb2.DeleteCohortMembersBulkRequest, timeout: float | None = None
    ) -> cohort_pb2.DeleteCohortMembersBulkResponse:
        batch_size = request.batch_size if request.batch_size > 0 else 10000
        return cohort_pb2.DeleteCohortMembersBulkResponse(
            deleted_count=_delete(
                self._cohort_members().filter(cohort_id__in=list(request.cohort_ids)), batch_size
            )
        )

    # -- Feature flag hash key overrides --

    def delete_hash_key_overrides_by_teams(
        self, request: feature_flag_pb2.DeleteHashKeyOverridesByTeamsRequest, timeout: float | None = None
    ) -> feature_flag_pb2.DeleteHashKeyOverridesByTeamsResponse:
        from products.feature_flags.backend.models.feature_flag import FeatureFlagHashKeyOverride

        return feature_flag_pb2.DeleteHashKeyOverridesByTeamsResponse(
            deleted_count=_delete(
                FeatureFlagHashKeyOverride.objects.filter(team_id__in=list(request.team_ids)), request.batch_size
            )
        )
