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
| Auditing | Record tool name, user id, target interest id, timestamp, host/client id, and before/after summary. |
| Rate limits | Limit writes per user and per client to prevent accidental loops. |
| Observability | Log failures without dumping tokens, request bodies with secrets, or auth headers. |

## Tool safety matrix

| Tool | Remote availability | Guardrail |
| --- | --- | --- |
| `makimono_list_interests` | Yes | Authenticated user only. |
| `makimono_create_interest` | Yes | Validate category/title; audit creation. |
| `makimono_update_interest` | Yes | Reject no-op payloads; audit changed fields. |
| `makimono_update_interest_status` | Yes | Validate status transitions; audit previous and next status. |
| `makimono_delete_interest` | Yes, soft delete only | Audit and allow restore. |
| `makimono_restore_interest` | Yes | Audit restore. |
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

- [ ] Unauthenticated calls are rejected.
- [ ] The server never accepts `userId` as tool input.
- [ ] Logs do not contain tokens or auth headers.
- [ ] The list tool returns only the authenticated user's interests.
- [ ] Local stdio MCP still works.

## Second remote slice

Add low-risk writes after read-only remote access is proven.

### Scope

- `makimono_create_interest`
- `makimono_update_interest`
- `makimono_update_interest_status`
- audit events for every mutation
- write rate limits

### Acceptance checklist

- [ ] Each mutation writes an audit event.
- [ ] Mutations are scoped to the authenticated user.
- [ ] No-op updates are rejected.
- [ ] Write rate limits return clear errors.
- [ ] PocketBase rules prevent cross-user access even if the MCP server has a bug.

## Third remote slice

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
- [ ] Audit records for writes.
- [ ] Write rate limits.
- [ ] Soft delete before permanent delete.
- [ ] Tool descriptions clearly state side effects.
- [ ] Recovery path for accidental writes.

## Next step

Implement the first remote slice as a read-only HTTPS MCP endpoint. Do not expose write tools remotely until auth, audit, and rate limits are in place.
