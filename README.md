# happy-wakey-monorepo

Pinned integration superproject for the Happy Wakey application fleet. Every repository under `apps/` is a Git submodule at an exact commit so a review, E2E run, or release can identify the complete source set.

```sh
git clone --recurse-submodules https://github.com/happy-wakey/happy-wakey-monorepo.git
```

## Application map

| Path | Responsibility |
| --- | --- |
| `apps/happy-wakey-interfaces` | Types, OpenAPI, JSON Schema, SQL, and formal contracts; no implementations. |
| `apps/happy-wakey-lib-core` | Domain implementations and role-aware SeaORM boundary. |
| `apps/happy-wakey-api-server.rs` | Shared Auth-protected JSON API, SeaORM persistence, reducers, and Ores telemetry. |
| `apps/happy-wakey-web-server.rs` | MASH, Leptos, and Dioxus SSR frontends with Shared Auth and Ores telemetry. |
| `apps/happy-wakey-clients` | Contract-generated clients across 16 languages and multiple TypeScript runtimes. |
| `apps/happy-wakey-sync` | Bounded Opto Sync integration for client-owned data. |
| `apps/happy-wakey-cli` | Rust CLI using the official Shared Auth client. |
| `apps/happy-wakey-flutter` | Mobile, web, and desktop Flutter application. |
| `apps/happy-wakey-desktop-app.rs` | Native Rust/Qt desktop application revived with its original history. |
| `apps/happy-wakey-e2e` | Cross-service topology, security, resilience, and live acceptance evidence. |
| `apps/happy-wakey-infra` | Cloudflare, Kubernetes, TLS/secret mounts, and pre-provisioned JetStream desired state. |

`happy-wakey-infra` retains its independent release and security surface while
also appearing here as an exact gitlink, so a fleet pin includes the reviewed
deployment and JetStream desired state without copying infrastructure files.

## Web/API interaction audit

The accepted topology has four avenues, all returning `happy-wakey-interfaces` contracts and applying the same verified identity and product authorization:

| Avenue | Exact-pin evidence | Current gate |
| --- | --- | --- |
| Direct database read | The web pin calls only the subject-scoped `happy-wakey-lib-core` read capability; infra requires a database-enforced read-only role. | Merged API/web pins; native tests and strict linting passed locally against the exact private Shared Auth revision. |
| Stateless HTTPS | The web pin uses bounded no-redirect HTTPS and the API re-introspects the bearer with the official typed Shared Auth client. | Merged API/web pins; the API rejects oversized request bodies and the web client bounds streamed responses. |
| Stateful TLS | The pins implement asymmetric bounded frames, connection/request limits, TLS verification, reconnect-on-read-failure, and reauthentication on every frame. | Merged API/web pins and local bounded transport tests. |
| Async JetStream/outbox | Authenticated HTTPS registers the outbox; the credential-free signal enters a pre-provisioned durable stream; the API commits and durably publishes the response before acknowledging the request. | Merged API/web pins and pre-provisioned durable topology; Core NATS is explicitly forbidden. |

This integration pin uses merged API revision
`62d0efd597e4686e6aa34d58dd97af627af09f11` and merged web revision
`216bac3e9f14bedb55c14cc023aca933787a45e6`. Required hosted native CI cannot
read the official private Shared Auth source at
`cc57a85b276bee81ad94decc87df2f48d49cab9f`; a job that skips native
compilation when that repository is unreadable is not substantive CI evidence.
Both server changes were merged before the workflow received a narrowly scoped
repository/org read credential or an approved public/package distribution, so
the missing native CI evidence remains an explicit release blocker. Do not claim
deployment readiness without exact image digests and live environment evidence.

## Dependency and submodule discipline

Use the released `zed-pkg` CLI for the superproject checks:

```sh
zed validate
zed install --adapter node
zed run npm test
```

To advance a submodule, first validate, commit, and push the child repository. Then update only its gitlink here and record the child tests in the review. Never point a gitlink at an unpushed commit, an unreviewed branch head, or a local path.
