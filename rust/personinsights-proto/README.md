# personinsights-proto

Rust bindings for the PersonInsights gRPC services.

Proto definitions live in the top-level [`/proto/personinsights`](/proto/personinsights) directory (language-agnostic location for multi-language code generation).

## Proto Structure

```text
/proto/personinsights/           # At repo root
├── types/v1/               # Shared message types
├── service/v1/             # Public API (router)
├── replica/v1/             # Internal read API
└── leader/v1/              # Internal write API [future]
```

Each component is versioned independently, allowing breaking changes to internal APIs without affecting the public API.

## Building

```bash
cargo build -p personinsights-proto
```

## Rust Usage

```rust
use personinsights_proto::personinsights::{
    types::v1::{Person, GetPersonRequest},
    service::v1::person_insights_service_server::PersonInsightsService,
    replica::v1::person_insights_replica_client::PersonInsightsReplicaClient,
};
```

## Example Development Flow For Adding a New Endpoint

Example: adding `GetPersonProperties` to the replica service.

**1. Add message types** (`/proto/personinsights/types/v1/person.proto`):

```protobuf
message GetPersonPropertiesRequest {
  int64 team_id = 1;
  int64 person_id = 2;
}

message GetPersonPropertiesResponse {
  bytes properties = 1;
}
```

**2. Add method to service** (`/proto/personinsights/replica/v1/replica.proto`):

```protobuf
rpc GetPersonProperties(personinsights.types.v1.GetPersonPropertiesRequest)
    returns (personinsights.types.v1.GetPersonPropertiesResponse);
```

**3. Rebuild proto crate:**

```bash
cargo build -p personinsights-proto
```

**4. Implement the endpoint.** The compiler will error until you add the method:

```bash
cargo build -p personinsights-replica  # fails: missing method
# Add implementation in personinsights-replica/src/service.rs
cargo build -p personinsights-replica  # succeeds
```

**5. Update the router** to call the new endpoint:

```bash
cargo build -p personinsights-router  # add client call
```

The compiler guides you—once you add a method to a service definition, any crate implementing that trait must add the implementation.

## Proto Conventions

- `int64` for IDs, timestamps (Unix millis), versions
- `bytes` for JSON data (not string)
- `optional` for nullable fields
- Stay at v1 for additive changes; bump to v2 only for breaking changes
- Never reuse field numbers after deletion
