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
| Direct database read | The web pin calls only the subject-scoped `happy-wakey-lib-core` read capability; infra requires a database-enforced read-only role. | API/web pins are pushed draft PR heads pending required CI access to the official private Shared Auth client. |
| Stateless HTTPS | The web pin uses bounded no-redirect HTTPS and the API re-introspects the bearer with the official typed Shared Auth client. | Same private-dependency CI gate. |
| Stateful TLS | The pins implement asymmetric bounded frames, connection/request limits, TLS verification, reconnect-on-read-failure, and reauthentication on every frame. | Same private-dependency CI gate. |
| Async JetStream/outbox | Authenticated HTTPS registers the outbox; the credential-free signal enters a pre-provisioned durable stream; the API commits and durably publishes the response before acknowledging the request. | Same private-dependency CI gate; Core NATS is explicitly forbidden. |

This branch intentionally pins pushed draft API/web revisions
`89435504161a577aa5538160accc5866020d0a6f` and
`3983a1200c0179cbcfd575746d903ccec0cc4177`. It must remain unmerged until a
narrowly scoped Actions read credential or approved package distribution lets
required CI fetch `shared-auth/shared-auth-clients`, both child PRs are green
and merged, and these gitlinks are repinned to their resulting main commits.
Do not claim deployment readiness without exact image digests and live
environment evidence.

## Dependency and submodule discipline

Use the released `zed-pkg` CLI for the superproject checks:

```sh
zed validate
zed install --adapter node
zed run npm test
```

To advance a submodule, first validate, commit, and push the child repository. Then update only its gitlink here and record the child tests in the review. Never point a gitlink at an unpushed commit, an unreviewed branch head, or a local path.
