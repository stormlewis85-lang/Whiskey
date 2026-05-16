---
name: api-design-principles
description: |
  ALWAYS use when designing new API endpoints, reviewing API changes, or planning
  versioning strategy. Use for error format, input validation, and response schema
  decisions. Do NOT use for internal function signatures or architecture decisions.
---

## URL Design
- Nouns not verbs: `/users` not `/getUsers`
- Plural nouns, kebab-case for multi-word: `/user-profiles`
- Nest for relationships, max 2 levels: `/users/:id/posts`
- Query params for filtering/sorting/pagination

## HTTP Methods

| Method | Purpose | Idempotent | Body |
|---|---|---|---|
| GET | Read | Yes | No |
| POST | Create | No | Yes |
| PUT | Replace entirely | Yes | Yes |
| PATCH | Partial update | Yes | Yes |
| DELETE | Remove | Yes | No |

## Response Envelope
```json
{ "data": { ... }, "meta": { "page": 1, "total": 42 }, "errors": null }
```

## Error Format
```json
{ "data": null, "errors": [{ "code": "VALIDATION_ERROR", "message": "Email is required", "field": "email", "status": 422 }] }
```

## Status Codes
- 400: Malformed request
- 401: Not authenticated
- 403: Not authorized
- 404: Not found
- 409: Conflict
- 422: Validation error (valid JSON, invalid data)
- 429: Rate limited
- 500: Server error (never expose internals)

## Versioning
- URL prefix: `/api/v1/users`
- Increment major only for breaking changes
- Support previous version during deprecation window

## Input Validation
- Validate at the boundary — every external input
- Reject early with clear error messages
- Sanitize strings, enforce types, set reasonable limits

## Output Checklist
For each endpoint document:
- [ ] Method, path, description, auth requirement
- [ ] Request/response examples (happy + error)
- [ ] Validation rules table (field, type, required, constraints)
