# Remote Makimono MCP Plan

Makimono should expose remote MCP write access only after it has real user authentication, scoped authorization, auditability, and conservative write limits. The local stdio MCP server proves the tool contract; the remote version must protect real user lists before ChatGPT, Gemini, or another external host can modify them.

## Quick path

1. Keep the local MCP server as the development baseline.
2. Add a hosted HTTPS MCP endpoint with per-user authentication.
3. Gate every write tool behind scoped permissions, audit logs, and rate limits.
4. Enable external clients only after destructive and bulk operations require explicit confirmation.

## Target architecture

```txt
ChatGPT / Gemini / MCP host
  -> HTTPS remote MCP endpoint
    -> Makimono auth/session boundary
      -> PocketBase interests collection
        -> Makimono webapp reflects changes
```

The remote MCP server should not reuse a copied browser token as a long-term credential. It should issue or exchange server-side credentials that are scoped to one Makimono user and can be revoked.

## Decisions

| Area | Decision |
| --- | --- |
| Transport | Use HTTPS MCP for remote clients; keep stdio for local development. |
| Auth | Require per-user auth before listing or mutating interests. |
| User scope | Every tool call must resolve exactly one user id server-side. Do not trust user ids from tool input. |
| Storage | Do not store raw long-lived PocketBase user tokens unless encrypted and revocable. Prefer short-lived server-issued credentials. |
| Writes | Allow small, explicit writes first: create, update, status change, soft delete, restore. |
| Destructive actions | Keep delete as soft delete. Require confirmation for bulk delete or permanent delete. |
| Auditing | Record tool name, user id, target interest id, PocketBase created timestamp, host/client id when available, and non-secret before/after summary. |
| Rate limits | Limit writes per user and per client to prevent accidental loops. |
| Observability | Log failures without dumping tokens, request bodies with secrets, or auth headers. |

## Tool safety matrix

| Tool | Remote availability | Guardrail |
| --- | --- | --- |
| `makimono_list_interests` | Yes | Authenticated user only. |
| `makimono_create_interest` | Yes, only when `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true` | Validate category/title; use resolved user id; audit creation; rate limit writes. |
| `makimono_update_interest` | Yes, only when `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true` | Scope lookup to resolved user; reject no-op payloads; audit changed fields; rate limit writes. |
| `makimono_update_interest_status` | Not yet | Validate status transitions; audit previous and next status. |
| `makimono_delete_interest` | Not yet | Soft delete only; audit and allow restore. |
| `makimono_restore_interest` | Not yet | Audit restore. |
| Bulk mutation tools | Not in first remote slice | Require explicit confirmation and stricter limits. |
| Permanent delete | Not allowed initially | Add only with separate approval and recovery policy. |

## First remote slice

Build the smallest remote endpoint that can safely prove connectivity.

### Scope

- Expose remote MCP over HTTPS.
- Support `makimono_list_interests` only.
- Authenticate one test user through a server-side auth boundary.
- Add structured error responses and safe logs.

### Acceptance checklist

- [x] Unauthenticated calls are rejected.
- [x] The server never accepts `userId` as tool input.
- [x] Logs do not contain tokens or auth headers.
- [x] The list tool returns only the authenticated user's interests.
- [x] Local stdio MCP still works.

### Current implementation status

The first remote slice is implemented at `POST /api/mcp` as a minimal JSON-RPC MCP compatibility endpoint. It intentionally supports only:

- `initialize`
- `tools/list`
- `tools/call` for `makimono_list_interests`

Every request must include `Authorization: Bearer <PocketBase token>`. The endpoint resolves the authenticated PocketBase user with the `users` collection `auth-refresh` endpoint by default, or `MAKIMONO_POCKETBASE_AUTH_COLLECTION` when the auth collection name differs. List calls use the caller token and add an explicit PocketBase filter for the resolved user id (`user="<id>"`) before applying local `includeDeleted` and `query` filtering.

Caveats:

- This is not the SDK streamable HTTP transport; it is a narrow JSON-RPC compatibility slice for the first read-only remote test.
- Remote write tools are disabled by default.
- Production exposure still requires HTTPS, safe platform logs, and verified PocketBase collection rules in addition to the explicit server-side user filter.

## Second remote slice

Add the first low-risk write after read-only remote access is proven.

### Scope

- `makimono_create_interest` only
- explicit remote write opt-in with `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true`
- durable PocketBase audit event for successful create, with safe server-log fallback
- basic per-user write rate limit

### Acceptance checklist

- [x] Create writes a durable audit event when `remote_mcp_audit_events` is available.
- [x] Audit failure falls back to a safe server log and does not fail the created item response.
- [x] Create is scoped to the authenticated user resolved through PocketBase `auth-refresh`.
- [x] Create ignores caller-provided user ids by rejecting unsupported input keys.
- [x] Write rate limits return clear errors.
- [x] PocketBase audit collection rules are documented for per-user create/list/view and no client update/delete.
- [ ] PocketBase rules are imported and verified in the live PocketBase instance.

### Current implementation status

The remote endpoint now exposes `makimono_create_interest` only when `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true` is set. When the flag is missing or set to any other value, `tools/list` still returns only `makimono_list_interests`, and remote create calls are rejected.

Remote create continues to require `Authorization: Bearer <PocketBase token>`. The server resolves the user id with PocketBase `auth-refresh` and writes that resolved id to the `user` relation; `userId` is not accepted from tool input.

Write limits default to 5 writes per minute per resolved user and can be changed with `MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE`. The current limiter is in memory, so it resets on server restart and does not coordinate across multiple app instances.

Audit events include tool name, action, outcome, resolved user id, target collection/id, and a non-secret summary. The default sink writes to the PocketBase `remote_mcp_audit_events` collection, configurable with `MAKIMONO_REMOTE_MCP_AUDIT_COLLECTION`. If the collection is missing or the audit write fails, remote create still returns the created item and falls back to a safe server log without tokens or auth headers.

Import `docs/pocketbase-collections.json` into PocketBase before treating remote writes as production-ready. The file now includes `remote_mcp_audit_events` with per-user list/view/create rules and disabled client update/delete rules.

## Third remote slice

Add guarded remote updates after the create slice.

### Scope

- `makimono_update_interest`
- explicit remote write opt-in with `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true`
- scoped lookup by resolved user before PATCH
- durable PocketBase audit event for successful update, with safe server-log fallback
- basic per-user write rate limit

### Acceptance checklist

- [x] Update is omitted from `tools/list` and rejected unless remote writes are enabled.
- [x] Update rejects unsupported fields such as `userId`, `status`, `deletedAt`, and cover metadata.
- [x] Update normalizes tags, clears empty notes to `null`, and rejects no-op payloads.
- [x] Update verifies the target belongs to the authenticated user before PATCH.
- [x] Update writes a durable audit event with changed field names and no token/header data.
- [x] Write rate limits return clear errors.

### Current implementation status

The remote endpoint now exposes `makimono_update_interest` alongside create only when `MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true` is set. Remote update accepts `id` plus `title`, `notes`, and/or `tags` only. It trims titles, clears blank notes to `null`, trims/deduplicates tags, and rejects calls without editable fields.

Before issuing the PocketBase `PATCH`, the endpoint performs a scoped lookup with `id="<interest-id>" && user="<resolved-user-id>"`. If the lookup does not find a record for the authenticated user, the endpoint returns a clear JSON-RPC not-found error and does not update.

Successful updates use the same per-user write limiter and durable audit sink as create. Audit summaries include changed field names, not token or authorization header data.

## Later guarded write slices

Add remaining low-risk writes only after the guarded create and update slices have imported durable audit storage and production-ready rate limiting.

### Scope

- `makimono_update_interest_status`
- audit events for every mutation
- shared rate limits across app instances

### Acceptance checklist

- [ ] Each mutation writes a durable audit event and keeps a safe fallback path.
- [ ] Mutations are scoped to the authenticated user.
- [ ] Shared write rate limits return clear errors.

## Fourth remote slice

Add reversible destructive operations.

### Scope

- `makimono_delete_interest` as soft delete only
- `makimono_restore_interest`
- optional confirmation challenge for delete requests

### Acceptance checklist

- [ ] Delete sets `deletedAt`; it does not physically remove records.
- [ ] Restore clears `deletedAt`.
- [ ] Delete and restore are audited.
- [ ] The webapp can still show or hide deleted records according to existing behavior.

## Remote client notes

ChatGPT and Gemini support for custom MCP endpoints can vary by product, account type, and connector model. Keep the remote server standards-based and HTTPS-ready, but do not assume every host can connect until the target client confirms its connector requirements.

When a host supports custom connectors, configure it with:

- the remote MCP URL
- the chosen auth mechanism
- the narrowest available scopes
- a clear label such as `makimono`

## Security checklist before public exposure

- [ ] HTTPS only.
- [ ] Per-user authentication.
- [ ] Server-side user resolution.
- [ ] No raw token logging.
- [ ] Scoped PocketBase collection rules.
- [ ] Audit collection imported and verified for writes.
- [ ] Write rate limits.
- [ ] Soft delete before permanent delete.
- [ ] Tool descriptions clearly state side effects.
- [ ] Recovery path for accidental writes.

## Next step

Import and verify the PocketBase audit collection, then add shared production-ready write rate limits before exposing more remote write tools.
