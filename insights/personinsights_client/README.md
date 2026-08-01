# personinsights_client

Python gRPC client for the personinsights service — the required interface for all person, group, and cohort data access from Django.

## Why this client exists

Personhog is an internal service that owns the source of truth for person-related data.
**All Django code must use this client (or the routed helpers built on it) instead of querying person/group tables via the ORM or raw SQL.**
Direct ORM queries like `Person.objects.filter(...)` or `PersonDistinctId.objects.filter(...)` are not allowed for new code.

Routed helpers that handle the gRPC call and metrics already exist in
`insights/models/person/util.py` and `insights/models/group_type_mapping.py` — use these when one fits your use case.
When no existing helper covers your needs, follow the `_personinsights_routed()` pattern in `insights/models/person/util.py`.
personinsights is the sole read path — there is no ORM fallback.

## Database tables

The following tables are managed by personinsights.
Do not query them directly — use the routed helpers or client RPCs.

| Table                                | Django model                 | Description                        |
| ------------------------------------ | ---------------------------- | ---------------------------------- |
| `insights_person`                     | `Person`                     | Core person records                |
| `insights_persondistinctid`           | `PersonDistinctId`           | Distinct ID → person mappings      |
| `insights_cohortpeople`               | `CohortPeople`               | Static cohort membership           |
| `insights_group`                      | `Group`                      | Group records                      |
| `insights_grouptypemapping`           | `GroupTypeMapping`           | Group type → column index mappings |
| `insights_personoverride`             | `PersonOverride`             | Person merge overrides             |
| `insights_pendingpersonoverride`      | `PendingPersonOverride`      | Pending person merge overrides     |
| `insights_flatpersonoverride`         | `FlatPersonOverride`         | Flattened person overrides         |
| `insights_featureflaghashkeyoverride` | `FeatureFlagHashKeyOverride` | Feature flag hash key overrides    |
| `insights_personlessdistinctid`       | `PersonlessDistinctId`       | Personless distinct IDs            |
| `insights_personoverridemapping`      | `PersonOverrideMapping`      | Person override mappings           |

## Client singleton

`get_personinsights_client()` returns a thread-safe singleton `PersonHogClient` instance, configured from Django settings.
Returns `None` when `PERSONFN_ADDR` is not set (e.g. in local dev without personinsights running).

## Proto converters

`converters.py` provides functions to convert gRPC proto messages into Django model instances or dicts:

- `proto_person_to_model()` — converts a proto `Person` to an unsaved Django `Person` instance
- `proto_group_type_mapping_to_dict()` — converts a proto `GroupTypeMapping` to a dict matching the ORM `.values()` shape
- `proto_group_type_mapping_to_result()` — converts to a lightweight `GroupTypeMappingResult` dataclass

These ensure that existing serializers and property accessors work without modification.

## Available RPCs

The `PersonHogClient` in `client.py` exposes typed methods for every RPC:

**Person lookups:**
`get_person`, `get_persons`, `get_person_by_uuid`, `get_persons_by_uuids`,
`get_person_by_distinct_id`, `get_persons_by_distinct_ids_in_team`

**Distinct ID operations:**
`get_distinct_ids_for_person`, `get_distinct_ids_for_persons`

**Person deletes:**
`delete_persons`, `delete_persons_batch_for_team`

**Person split:**
`split_person` — splits distinct_ids off a person onto new persons (max 250 per request); the sole write path for person splits, with no ORM fallback

**Cohort membership:**
`check_cohort_membership`, `count_cohort_members`, `insert_cohort_members`,
`delete_cohort_member`, `delete_cohort_members_bulk`, `list_cohort_member_ids`

**Groups:**
`get_group`, `get_groups`, `get_groups_batch`

**Group type mappings:**
`get_group_type_mappings_by_team_id`, `get_group_type_mappings_by_team_ids`,
`get_group_type_mappings_by_project_id`, `get_group_type_mappings_by_project_ids`

## Testing

Use the `FakePersonHogClient` for tests.
It implements the same interface as `PersonHogClient` using real proto messages,
so the full converter pipeline is exercised end-to-end.

```python
from insights.personinsights_client.fake_client import fake_personinsights_client

def test_something(self):
    with fake_personinsights_client() as fake:
        fake.add_person(team_id=1, person_id=42, uuid="some-uuid", distinct_ids=["user@example.com"])
        fake.add_group_type_mapping(project_id=1, group_type="org", group_type_index=0)
        fake.add_group(team_id=1, group_type_index=0, group_key="insights")
        fake.add_cohort_membership(person_id=42, cohort_id=7)

        # code under test calls get_personinsights_client() and gets the fake
        result = get_person_by_uuid(1, "some-uuid")
        assert result is not None

        # Assert specific RPCs were called
        fake.assert_called("get_person_by_uuid", times=1)
```

## Observability

The client emits Prometheus metrics at multiple layers:

**Routing metrics** (`metrics.py`):

- `personinsights_routing_total` — counts personinsights reads per operation
- `personinsights_routing_errors_total` — personinsights read errors per operation
- `personinsights_team_mismatch_total` — persons dropped because personinsights returned a mismatched team_id

**gRPC request metrics** (`interceptor.py`):

- `personinsights_django_grpc_request_duration_seconds` — request latency histogram
- `personinsights_django_grpc_requests_total` — request count by method and status
- `personinsights_django_grpc_timeouts_total` — deadline exceeded count

**Channel metrics** (`client.py`):

- `personinsights_django_grpc_channel_state` — current gRPC channel connectivity state
- `personinsights_django_grpc_channel_state_transitions_total` — state transition count
- `personinsights_django_grpc_connection_establishment_seconds` — time to establish connection

## Directory layout

- `client.py` — `PersonHogClient` with typed methods for each RPC, plus `get_personinsights_client()` singleton
- `converters.py` — proto-to-Django conversion functions
- `fake_client.py` — `FakePersonHogClient` for tests
- `interceptor.py` — gRPC interceptors for client name headers and request metrics
- `metrics.py` — Prometheus counters for routing decisions
- `proto/generated/` — auto-generated protobuf stubs (do not edit)
- `proto/__init__.py` — convenience re-exports of proto types

For updating proto definitions, see [`proto/README.md`](/proto/README.md).
