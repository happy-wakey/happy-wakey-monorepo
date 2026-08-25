# happy-wakey-monorepo

Pinned integration superproject for the Happy Wakey application fleet. Every repository under `apps/` is a Git submodule at an exact commit so a review, E2E run, or release can identify the complete source set.

```sh
git clone --recurse-submodules https://github.com/happy-wakey/happy-wakey-monorepo.git
```

## Application map

| Path | Responsibility |
| --- | --- |
| `apps/happy-wakey-interfaces` | Types, OpenAPI, JSON Schema, SQL, Bluetooth, and formal contracts; no implementations. |
| `apps/happy-wakey-lib-core` | Domain and persistence implementations for SeaORM, Drizzle, Prisma, GORM, and gRPC. |
| `apps/happy-wakey-api-server.rs` | Shared Auth-protected Rust JSON API, SeaORM persistence, and four bounded request transports. |
| `apps/happy-wakey-web-server.rs` | Rust MASH SSR with HTMX, Maud, Axum, SeaORM, Leptos, Dioxus islands, and four API transports. |
| `apps/happy-wakey-clients` | Contract-generated external SDKs across 17 language and runtime targets. |
| `apps/happy-wakey-sync` | Bounded Opto Sync integration for client-owned data. |
| `apps/happy-wakey-cli` | Rust CLI using flags-2-env and the bounded public Shared Auth protocol. |
| `apps/happy-wakey-flutter` | Mobile, web, and desktop Flutter application with native universal_ble support. |
| `apps/happy-wakey-desktop-app.rs` | Native Rust/Qt desktop application with btleplug Bluetooth; no React or webview UI. |
| `apps/happy-wakey-e2e` | Exact-pin cross-service topology, Bluetooth, security, resilience, and optional live acceptance evidence. |
| `apps/happy-wakey-infra` | Cloudflare, Kubernetes, TLS/secret mounts, and pre-provisioned JetStream desired state. |

`happy-wakey-infra` retains its independent release and security surface while
also appearing here as an exact gitlink, so a fleet pin includes the reviewed
deployment and JetStream desired state without copying infrastructure files.

## Web/API interaction audit

The accepted topology has four avenues, all returning `happy-wakey-interfaces` contracts and applying the same verified identity and product authorization:

| Avenue | Exact-pin evidence | Current gate |
| --- | --- | --- |
| Direct database read | The web server calls only the subject-scoped `happy-wakey-lib-core` read capability; infra requires a database-enforced read-only role. | Implemented and source-tested; live database role enforcement remains a deployment gate. |
| Stateless HTTPS | The web server uses bounded, no-redirect HTTPS and the API re-introspects each bearer through the public Shared Auth protocol. | Implemented and exercised in native tests at the pinned heads. |
| Stateful TCP/TLS | The servers use bounded length-delimited frames, TLS verification, connection/request limits, reconnect-on-read-failure, and per-frame authentication. | Implemented and exercised by bounded transport tests at the pinned heads. |
| Async NATS JetStream/outbox | Authenticated HTTPS registers the outbox; a credential-free signal enters a pre-provisioned durable stream; the API commits and durably publishes a response before acknowledging the request. | Implemented and source-tested; live broker durability and settlement remain deployment gates. |

The pinned API and web revisions build in hosted CI without a private Git
dependency: each implements the bounded public Shared Auth HTTPS protocol and
validates the same interface revision. Exact source heads and hosted checks are
recorded here and in `happy-wakey-e2e`. They prove the reviewed source set, not a
deployed environment. Do not claim deployment readiness without exact image
digests, live Shared Auth/database/broker evidence, and physical Bluetooth-radio
evidence.

## Dependency and submodule discipline

Use the released `zed-pkg` CLI for the superproject checks:

```sh
zed validate
zed install --adapter node
zed run npm test
```

To advance a submodule, first validate, commit, and push the child repository. Then update only its gitlink here and record the child tests in the review. Never point a gitlink at an unpushed commit, an unreviewed branch head, or a local path.
