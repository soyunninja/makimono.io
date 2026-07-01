# Local Makimono MCP server

Use this local stdio MCP server when an AI client needs to read or safely update Makimono interests during development. It talks to the existing PocketBase `interests` collection through minimal REST calls and returns structured tool results.

## Quick path

1. Provide PocketBase environment variables in your local MCP client config.
2. Register this project command as the `makimono` MCP server.
3. Ask the client to list, create, update, change status, delete, or restore interests.

```sh
npx pnpm mcp:dev
```

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

Register the server with the name `makimono` so prompts and tool logs are easy to recognize.

```jsonc
{
  "mcp": {
    "makimono": {
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
| `makimono_delete_interest` | Soft deletes an interest by setting `deletedAt`. | `id` |
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

By default, remote MCP exposes only `makimono_list_interests`. Enable the guarded remote create slice explicitly:

```sh
MAKIMONO_REMOTE_MCP_ENABLE_WRITES=true
MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE=5
```

Notes:

- `MAKIMONO_REMOTE_MCP_ENABLE_WRITES` must be exactly `true`; otherwise remote create is omitted from `tools/list` and rejected on call.
- `MAKIMONO_REMOTE_MCP_WRITE_LIMIT_PER_MINUTE` defaults to 5 writes per minute per resolved user.
- The current write limiter is in memory and resets when the server restarts.
- Successful remote create calls emit a safe audit event to server logs by default. The audit event omits tokens and auth headers, but server logs are not a durable production audit store.

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

## Troubleshooting

| Symptom | Check |
|---------|-------|
| “Missing PocketBase URL” | Set `MAKIMONO_POCKETBASE_URL`, or ensure `VITE_POCKETBASE_URL` is inherited by the MCP process. |
| “Missing PocketBase auth token” | Set `MAKIMONO_POCKETBASE_TOKEN` in the MCP client environment. |
| “Missing PocketBase user id” on create | Set `MAKIMONO_POCKETBASE_USER_ID`; update, status, delete, and restore do not need it. |
| PocketBase status error | Verify the token, collection name, record id, and PocketBase collection rules. |
| No records returned | Check `includeDeleted`, the `query` filter, and whether the token can list the `interests` collection. |
