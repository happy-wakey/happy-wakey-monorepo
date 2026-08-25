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

`happy-wakey-infra` remains a standalone repository with an independent release and security surface. It is integrated through reviewed configuration, image digests, CI artifacts, and deployment APIs; it is deliberately not a submodule.

## Web/API interaction audit

The accepted topology has four avenues, all returning `happy-wakey-interfaces` contracts and applying the same verified identity and product authorization:

| Avenue | Exact-pin evidence | Remaining implementation gate |
| --- | --- | --- |
| Direct database read | `happy-wakey-lib-core` supplies a subject-scoped read-only SeaORM context; infra has a distinct read-role secret reference. | The pinned web server does not yet select this context. |
| Stateless HTTP | The pinned web server calls the pinned API over bounded no-redirect HTTP. | Keep cross-service contract tests at every pin bump. |
| Stateful TCP | Infra reserves the API TCP endpoint and E2E defines bounded TLS length-delimited JSON semantics. | The pinned API and web servers do not yet implement the listener/client pool. |
| Asynchronous NATS | Infra supplies separate runtime references and E2E requires JetStream durability. | The pinned API and web servers do not yet implement durable request/reply and settlement. |

This ledger distinguishes reviewed target contracts from code that is actually present at these pins. Do not claim all four avenues are deployed until the missing server implementations, failure-mode tests, exact image digests, and deployment evidence land.

## Dependency and submodule discipline

Use the released `zed-pkg` CLI for the superproject checks:

```sh
zed validate
zed install --adapter node
zed run npm test
```

To advance a submodule, first validate, commit, and push the child repository. Then update only its gitlink here and record the child tests in the review. Never point a gitlink at an unpushed commit, an unreviewed branch head, or a local path.
