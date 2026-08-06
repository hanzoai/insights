# Proto definitions

## Adding or modifying RPCs

When you add or modify an RPC or message type in `personinsights/` protos, you **must** update all downstream consumers before considering the change complete:

### 1. Python generated stubs

```bash
bin/generate_personinsights_proto.sh
```

Then update:

- `insights/personinsights_client/proto/__init__.py` — add/remove re-exports for any new/removed message types
- `insights/personinsights_client/client.py` — add/remove wrapper methods for any new/removed RPCs
- `insights/personinsights_client/fake_client.py` — implement the new method for test use

### 2. Node.js generated stubs

```bash
cd nodejs && pnpm run generate:personinsights-proto
```

Then update:

- `nodejs/src/ingestion/personinsights/client.test.ts` — add a default stub to the `SERVICE_DEFAULTS` object for any new RPC

### 3. Rust

No codegen step needed (tonic regenerates on `cargo build`), but you must:

- Implement the RPC in `rust/personinsights-replica/` (storage layer + service handler)
- Wire it through `rust/personinsights-router/` (backend, router, and service layers)
- Add tests (see Rust test conventions in `rust/personinsights-replica/AGENTS.md`)
