# Makimono MCP servers

Makimono supports two MCP paths. Use the local stdio server for development-only direct PocketBase access, and use the remote HTTP endpoint when you need production writes to create durable audit events visible in `/dashboard/audit`.

## Quick path

1. Register the local server as `makimono-local` for direct PocketBase development work.
2. Register the production endpoint as `makimono-remote` for audited remote MCP work.
3. Use `makimono-remote` when validating `/dashboard/audit`.

```sh
npx pnpm mcp:dev
```

## Connector names

| Connector | Type | Target | Creates `/dashboard/audit` events |
|-----------|------|--------|-----------------------------------|
| `makimono-local` | `local` | `mcp/server.ts` -> PocketBase REST | No |
| `makimono-remote` | `remote` | `https://www.makimono.io/api/mcp` | Yes |

## Local setup

Set these values in your shell or MCP client configuration. Do not commit real values.

```sh
MAKIMONO_POCKETBASE_URL="https://your-pocketbase.example"
MAKIMONO_POCKETBASE_TOKEN="your-auth-token"
MAKIMONO_POCKETBASE_USER_ID="authenticated-user-id"
```

Notes:

- `MAKIMONO_POCKETBASE_URL` can be omitted if `VITE_POCKETBASE_URL` is already available to the MCP process.
- `MAKIMONO_POCKETBASE_TOKEN` is required for all PocketBase requests.
- `MAKIMONO_POCKETBASE_USER_ID` is required for `makimono_create_interest` because new records store the owner relation.
- The server does not read `.env` files. Inject environment through the client or shell that launches the process.

## OpenCode configuration example

Register the local server with the name `makimono-local` so prompts and tool logs clearly distinguish local direct PocketBase writes from remote audited writes.

```jsonc
{
  "mcp": {
    "makimono-local": {
      "type": "local",
      "command": ["npx", "pnpm", "mcp:dev"],
      "environment": {
        "MAKIMONO_POCKETBASE_URL": "https://your-pocketbase.example",
        "MAKIMONO_POCKETBASE_TOKEN": "your-auth-token",
        "MAKIMONO_POCKETBASE_USER_ID": "authenticated-user-id"
      }
    }
  }
}
```

Use placeholders in documentation and examples only. Store real tokens in local, uncommitted config.

## Tools

| Tool | Capability | Key inputs |
|------|------------|------------|
| `makimono_list_interests` | Lists interests, optionally including soft-deleted records and filtering by title, category, or tag. | `includeDeleted?`, `query?` |
| `makimono_create_interest` | Creates a pending interest. | `category`, `title`, `notes?`, `tags?` |
| `makimono_update_interest` | Edits an existing interest title, notes, or tags. Empty `notes` clears notes; omitted fields are unchanged. | `id`, `title?`, `notes?`, `tags?` |
| `makimono_update_interest_status` | Changes status to `pending`, `in_progress`, or `completed`. | `id`, `status` |
| `makimono_delete_interest` | Soft deletes an interest by setting `deletedAt`. | `id`, `confirm: "soft-delete"` |
| `makimono_restore_interest` | Restores a soft-deleted interest by clearing `deletedAt`. | `id` |

`makimono_update_interest` rejects calls that do not include at least one editable field. Tags are trimmed, empty entries are removed, and duplicates are collapsed before writing.

## Example prompts

- List: “Use Makimono to list my pending interests that match `space`.”
- Create: “Add `Children of Time` as a book interest with tags `sci-fi` and `books`.”
- Update: “Update interest `<id>` with title `Children of Time`, clear its notes, and set tags to `sci-fi` and `books`.”
- Status: “Mark interest `<id>` as completed.”
- Delete: “Soft delete interest `<id>`.”
- Restore: “Restore the deleted interest `<id>`.”

## Safety model

This server is for local development only.

- It uses stdio, so the MCP client owns process launch and environment injection.
- Delete is a soft delete: records are hidden by default but remain recoverable through restore.
- Error messages mention missing configuration but do not print secret values.
- PocketBase collection rules still control what the provided token can read or write.

Before exposing a remote MCP server to ChatGPT, Gemini, or any hosted client, add HTTPS-only transport, explicit client authentication, per-user token storage or token exchange, request auditing, rate limits, and narrowly scoped PocketBase rules.

## Remote MCP endpoint

The hosted app also exposes a narrow JSON-RPC MCP compatibility endpoint at `POST /api/mcp`.

Remote requests must include `Authorization: Bearer <PocketBase token>`. The server resolves the user id through PocketBase `auth-refresh`; remote tool input must not include a user id.

OpenCode remote configuration example:

```jsonc
{
  "mcp": {
    "makimono-remote": {
      "type": "remote",
      "url": "https://www.makimono.io/api/mcp",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer <PocketBase token>"
      }
    }
  }
}
```

Use the `makimono-remote` connector, not `makimono-local`, when validating that remote writes appear in `/dashboard/audit`.

By default, remote MCP exposes only `makimono_list_interests`. Enable guarded remote create, update, status update, soft delete, and restore explicitly:

```sh
MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true
MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE=5
MAKIMONO_REMOTE_MCP_AUDIT_COLLECTION=remote_mcp_audit_events
```

Notes:

- `MAKIMONO_REMOTE_MCP_ENABLE_WRITES` must be exactly `true`; otherwise remote create, update, status update, soft delete, and restore are omitted from `tools/list` and rejected on call.
- `MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE` defaults to 5 writes per minute per resolved user.
- `MAKIMONO_REMOTE_MCP_AUDIT_COLLECTION` defaults to `remote_mcp_audit_events`.
- The current write limiter is in memory and resets when the server restarts.
- Remote `makimono_delete_interest` is soft delete only and requires `confirm` to be exactly `soft-delete`. It sets `deletedAt`; it never physically deletes records.
- Successful remote create, update, status update, soft delete, and restore calls first try to create a durable audit record in PocketBase. If the audit collection is missing or the audit write fails, the user-facing write still succeeds and the server falls back to a safe log event. Audit payloads omit tokens and auth headers.
- Authenticated users can review their durable remote MCP audit events at `/dashboard/audit` without opening PocketBase admin. The screen reads recent `remote_mcp_audit_events` through the app's PocketBase session, relies on collection rules to scope events to the current user, and supports client-side filtering/search over the loaded events.

## PocketBase collection import

Import `docs/pocketbase-collections.json` into PocketBase before enabling remote writes in production-like environments. It defines both `interests` and `remote_mcp_audit_events`.

The audit collection rules are scoped to the authenticated user:

- authenticated users can create audit events only for their own `user` relation;
- authenticated users can list/view only their own audit events;
- client update/delete rules are disabled.

If you use a different collection name, set `MAKIMONO_REMOTE_MCP_AUDIT_COLLECTION` to match it. Keep the schema fields compatible with `user`, `toolName`, `outcome`, `targetCollection`, `targetId`, `action`, `summary`, `clientLabel`, and `requestId`.

Example remote create call when writes are enabled:

```sh
curl -X POST "https://your-app.example/api/mcp" \
  -H "Authorization: Bearer <PocketBase token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "makimono_create_interest",
      "arguments": {
        "category": "books",
        "title": "Dune",
        "notes": "Classic science fiction",
        "tags": ["sci-fi", "books"]
      }
    }
  }'
```

Example remote update call when writes are enabled:

```sh
curl -X POST "https://your-app.example/api/mcp" \
  -H "Authorization: Bearer <PocketBase token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "makimono_update_interest",
      "arguments": {
        "id": "<interest-id>",
        "title": "Dune Messiah",
        "notes": "",
        "tags": ["sci-fi", "books"]
      }
    }
  }'
```

Example remote status update call when writes are enabled:

```sh
curl -X POST "https://your-app.example/api/mcp" \
  -H "Authorization: Bearer <PocketBase token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "makimono_update_interest_status",
      "arguments": {
        "id": "<interest-id>",
        "status": "completed"
      }
    }
  }'
```

Example remote soft delete call when writes are enabled:

```sh
curl -X POST "https://your-app.example/api/mcp" \
  -H "Authorization: Bearer <PocketBase token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "makimono_delete_interest",
      "arguments": {
        "id": "<interest-id>",
        "confirm": "soft-delete"
      }
    }
  }'
```

Example remote restore call when writes are enabled:

```sh
curl -X POST "https://your-app.example/api/mcp" \
  -H "Authorization: Bearer <PocketBase token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "makimono_restore_interest",
      "arguments": {
        "id": "<interest-id>"
      }
    }
  }'
```

## Troubleshooting

| Symptom | Check |
|---------|-------|
| “Missing PocketBase URL” | Set `MAKIMONO_POCKETBASE_URL`, or ensure `VITE_POCKETBASE_URL` is inherited by the MCP process. |
| “Missing PocketBase auth token” | Set `MAKIMONO_POCKETBASE_TOKEN` in the MCP client environment. |
| “Missing PocketBase user id” on create | Set `MAKIMONO_POCKETBASE_USER_ID`; update, status, delete, and restore do not need it. |
| PocketBase status error | Verify the token, collection name, record id, and PocketBase collection rules. |
| No records returned | Check `includeDeleted`, the `query` filter, and whether the token can list the `interests` collection. |
