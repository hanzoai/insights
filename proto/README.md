# Proto Definitions

Language-agnostic protobuf definitions for Insights services.

## Structure

```text
proto/
├── buf.yaml              # Linting and breaking change config
└── personinsights/            # Person data service
    ├── types/v1/         # Shared message types
    ├── replica/v1/       # Read API
    └── service/v1/       # Public API
```

## Language Bindings

| Language | Package                                         | Notes                             |
| -------- | ----------------------------------------------- | --------------------------------- |
| Rust     | [`rust/personinsights-proto`](/rust/personinsights-proto) | Generated at build time via tonic |

## CI Checks

Proto changes trigger `.github/workflows/ci-proto.yml`:

- **Lint**: Style and naming conventions
- **Breaking**: Detects backwards-incompatible changes against `master`

## Adding a New Proto

1. Add/modify `.proto` files in the appropriate directory
2. Run `buf lint proto/` locally (if buf installed) or let CI validate
3. Update language bindings as needed
