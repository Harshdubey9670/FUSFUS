# Known Bugs & Issues Log

**Status**: ALL RESOLVED ✅

### User Relationship System Issues Resolved:
- **String vs ObjectId Comparison Bug**: Fixed `.includes()` strict equality failures on Mongoose `ObjectId` arrays across all 22 relationship endpoints.
- **Idempotency & HTTP 400 Errors**: Refactored `followUser` to return clean `200 OK` with `{ status: 'following' }` when attempting duplicate follows instead of throwing 400 Bad Request.
- **Missing Endpoints**: Implemented Close Friends (`/api/users/:id/close-friends`), User Report (`/api/users/:id/report`), and User Content Hide (`/api/users/:id/hide-content`).
- **Security & Block Safeguard**: Added block verification in `sendMessage` and feed filtering in `getFeed`.
- **Database Parity Sync**: Synchronized `User.isPrivate` boolean when updated from `UserSettings`.
- **Production Build Status**: Clean build in 389ms with zero errors.