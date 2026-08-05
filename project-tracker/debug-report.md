# InstaSnap AI - Full Project Debug Report

**Date & Time:** July 17, 2026
**Environment:** Local Development (Frontend: Vite/React, Backend: Node/Express)

---

## 1. Critical Errors (Priority 1)

### Database Connection Failure
- **File Name:** `server/src/server.js` (and Mongoose configuration)
- **Line Number:** Connection hook
- **Problem:** Server fails to connect to MongoDB and crashes with `MongoServerSelectionError` or IP Whitelist error.
- **Root Cause:** The database connection string `mongodb+srv://...` in `.env` is pointing to MongoDB Atlas, but the current local IP address is not whitelisted on the Atlas dashboard.
- **Solution Plan:** The user must add the current IP to the MongoDB Atlas network whitelist, or switch the `MONGO_URI` to a local `mongodb://localhost:27017/instasnap` database for disconnected development.

---

## 2. Medium Errors (Priority 2)

### Missing React Component Import (UI Crash Risk)
- **File Name:** `client/src/components/feed/StoriesRow.jsx`
- **Line Number:** 21
- **Problem:** `React(jsx-no-undef): 'Link' is not defined.`
- **Root Cause:** The `<Link>` component from `react-router-dom` is used to wrap the "Your story" button but is never imported at the top of the file. If this component renders and is interacted with, it will crash the React tree.
- **Solution Plan:** Add `import { Link } from 'react-router-dom';` to the top of `StoriesRow.jsx`.

---

## 3. Warnings (Priority 3)

### Missing React Hook Dependencies
- **File Name:** `client/src/components/navigation/GlobalSearch.jsx`
- **Line Number:** 83
- **Problem:** `useEffect` has a missing dependency: `suggestions.popularUsers.length`.
- **Root Cause:** The hook checks the length but doesn't track it, which could lead to stale closures or unexpected refetching behaviors.
- **Solution Plan:** Add `suggestions.popularUsers.length` to the dependency array or refactor the condition.

- **File Name:** `client/src/pages/user/VaultPage.jsx`
- **Line Number:** 145
- **Problem:** `useEffect` has a missing dependency: `fetchCollections`.
- **Root Cause:** A function defined outside or inside the component is called in the effect but not tracked.
- **Solution Plan:** Wrap `fetchCollections` in `useCallback` and add it to the dependency array.

### Unused Variables & Imports (Code Quality)
- **Problem:** Multiple files have unused imports (`AnimatePresence`, `motion`, `Loader2`) and unused variables (`page`, `isOwner`, unused `catch (err)`).
- **Files Affected:** `SignupPage.jsx`, `ChatPage.jsx`, `FollowingPage.jsx`, `FeedPage.jsx`, `CreateReelPage.jsx`.
- **Solution Plan:** Run a targeted cleanup to remove dead code and silence linter warnings.

---

## 4. Performance Issues

- **Problem:** `FeedPage.jsx` and other large listing pages render many heavy components (posts, carousels).
- **Root Cause:** Potential lack of virtualization for infinite scroll or memoization (`React.memo`) for heavy child components.
- **Solution Plan:** Implement `content-visibility: auto` on feed posts (already partially done) and verify `useCallback` is used for all prop functions passed to list items.

---

## 5. Security Issues

- **Problem:** The `.env` file contains production/Atlas credentials (`MONGO_URI`, `JWT_SECRET`, Cloudinary keys).
- **Root Cause:** These are currently accessible in the plaintext `.env` file locally.
- **Solution Plan:** Ensure `.env` is strongly added to `.gitignore` (verified it is) and that the `searchRoutes.js` rate limiting is actively protecting against search scraping.

---

## 6. Code Quality Issues

- **Problem:** Error swallowing in `catch` blocks.
- **File Name:** `ChatPage.jsx` (line 103), `FollowingPage.jsx` (line 49).
- **Root Cause:** Empty or unused `catch (e)` blocks mean silent failures on the frontend if an API request fails.
- **Solution Plan:** Log these errors to a monitoring service or display a toast notification to the user instead of ignoring them.
