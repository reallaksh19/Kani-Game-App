# Kani learner API v1 semantics

This file records response behavior that clients may rely on. The canonical learner evidence object remains `kani-attempt-v1`.

## Common errors

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Important status/code combinations:

- `400 INVALID_REQUEST` — malformed route/query/body/contract
- `401 UNAUTHENTICATED` — no valid guardian session
- `403 ORIGIN_NOT_ALLOWED` — browser origin is outside the exact allowlist
- `403 HOUSEHOLD_FORBIDDEN` — requested household is not linked to authenticated user
- `404 STUDENT_NOT_FOUND` — stable student ID does not belong to selected household
- `409 HOUSEHOLD_SELECTION_REQUIRED` — account belongs to multiple households and must select one
- `409 STUDENT_ID_CONFLICT` — stable student ID exists with different profile data
- `409 ATTEMPT_ID_CONFLICT` — immutable attempt ID exists with a different payload
- `413 BATCH_TOO_LARGE` / `PAYLOAD_TOO_LARGE` — bounded offline replay limit exceeded
- `429 RATE_LIMITED` — service-side write quota exceeded; response includes `Retry-After`
- `501 NOT_ENABLED_YET` — reserved remote revision/recommendation route is not live yet

## Idempotency

`attemptId` is the immutable event idempotency key within a household. Replaying an identical canonical event succeeds. Reusing the same ID for different evidence never overwrites prior evidence.

## Household selector

`x-kani-household-id` is a selector, not proof of authorization. The API independently verifies membership from the authenticated user identity.
