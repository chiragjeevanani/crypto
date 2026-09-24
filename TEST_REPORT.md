# Test Report: KnQ Crypto Project

- **Date:** 2026-09-19
- **Scope:** smart contracts, frontend (lint, build, serve), backend (syntax, load, API), MongoDB (connectivity and integrity)
- **Code changes:** none. All test tooling ran from a scratch directory outside the repo. This report is the only file added.
- **Important:** see [Section 0](#0-incident-during-testing) before anything else.

---

## 0. Incident during testing

The API sweep sent a plain `GET` to every public route. One of them, `GET /api/fix-posts` ([backend/app.js:134](backend/app.js#L134)), is an **unauthenticated migration endpoint that writes to the database**. It responded:

> `Successfully updated 48 posts in database.`

- **Effect:** for posts with `media.type == "image"` that look like video, it set `media.type = "video"`, `status = "approved"` and `isPublished = true`. 48 posts in the remote `crypto-appzeto` MongoDB (Atlas) database were changed by my run.
- **Cause:** this was unintended on my side. I had planned read-only checks and did not know that route mutated data.
- **Reversibility:** I took no snapshot, so I cannot restore the prior values automatically. The rule is idempotent, so anyone hitting the URL would have produced the same result. If the pre-run state matters (for example some posts were deliberately `pending`), restore from an Atlas backup or point-in-time snapshot taken before ~12:32 UTC on 2026-09-19.
- After I found this, the route was blocklisted and never called again. No other write requests were sent.

---

## 1. Summary

| Area | Check | Result |
|---|---|---|
| Smart contracts | `hardhat test` | **PASS**, 12 of 12 |
| Frontend | `vite build` | **PASS** (~32s, chunk-size warning) |
| Frontend | Serve the built bundle (`vite preview`) | **PASS**, SPA served, service worker served (see 4.3) |
| Frontend | `eslint .` | **FAIL**, 426 errors and 48 warnings |
| Frontend | Frontend to backend endpoint cross-check | **Not completed**, the frontend uses many `fetch` styles that a static scan could not match reliably |
| Frontend | Browser, unit or E2E tests | **Not run**, no test framework is installed |
| Backend | Syntax check of 148 JS files | **PASS** |
| Backend | Load `app.js` | **PASS**, 240 route handlers |
| Backend | API smoke tests (unauthenticated) | **PASS with 4 findings** (Section 3) |
| Database | Connectivity and integrity (read-only) | **PASS** (Section 2) |
| Backend | Authenticated flows (login, wallet, posting, admin CRUD, payments) | **Not run**, see Coverage gaps |

---

## 2. Database (MongoDB Atlas, `crypto-appzeto`)

Read-only checks only.

| Check | Result |
|---|---|
| Connect | OK, ~3.8s (SRV) |
| Ping | OK |
| Collections | 31, matching the 31 Mongoose models |
| Duplicate user emails | 0 |
| Users without an email | 0 |
| Admin-role users (`role` in `admin`/`superadmin`) | 0 (see note) |

Notes:
- The admin count of 0 may just mean admins are stored elsewhere. There is a `staffmembers` collection with 1 doc, and admin credentials come from `ADMIN_EMAIL` in `.env` via `seedAdmin`. I did not verify how admin login works.
- Largest collections:

| Collection | Docs |
|---|---|
| `wallettransactions` | 730 |
| `states` | 198 |
| `messages` | 172 |
| `posts` | 103 |
| `stories` | 35 |
| `collectibleownerships` | 34 |
| `users` | 30 |

- `nftownerships`, `campaigns`, `campaignsubmissions` and `reports` are empty.
- `nftownerships` has 7 indexes and 0 docs, and `collectibleownerships` has 6 indexes. Both look like overlapping NFT models and are worth a review.

---

## 3. Backend API

Method: the app was mounted in a scratch harness on a random port and connected to the real DB. No seeding and no background jobs ran. Only `GET` requests and unauthenticated negative `POST` requests were sent.

Of 101 GET routes: 5 were skipped (external calls or unsafe), 75 returned **401** (auth enforced), 19 returned 200 and 2 returned 404 for a non-existent dummy id.

### 3.1 Targeted checks

| Test | Expected | Actual | Result |
|---|---|---|---|
| `GET /api/health` | 200 | 200 | PASS |
| `GET /api/config` | 200 | 200 | PASS |
| Unknown route | 404 | 404 | PASS |
| Login, empty body | 400 | 400 | PASS |
| Login, wrong credentials | 401 | 401 | PASS |
| Register, empty body | 400 | 400 | PASS |
| `GET /api/admin/users`, no or bad token | 401 | 401 | PASS |
| `GET /api/user/wallet/balance`, no token | 401 | 401 | PASS |
| **`GET /api/admin/dashboard/stats`, no token** | 401 | **200 with data** | **FAIL** |
| **Login with `{"email":{"$ne":null}}`** | 400 | **500** | **FAIL** |
| **Malformed JSON body** | 400 | **500** | **FAIL** |

### 3.2 Findings

| # | Severity | Finding |
|---|---|---|
| A | **High** | **Unauthenticated admin data.** `GET /api/admin/dashboard/stats`, `/financials` and `/transactions` respond 200 with no token. Responses include total users, total revenue (696,451), revenue breakdown and recent wallet transactions with user details. The router is mounted at [app.js:107](backend/app.js#L107) and appears to have no auth middleware. The other admin routers (`/api/admin/users` and others) do return 401. |
| B | **High** | **`GET /api/fix-posts` is unauthenticated and mutates data** ([app.js:134](backend/app.js#L134)). Anyone can trigger a full-collection scan and writes. It also took 7.2s. It should be removed or protected. See Section 0. |
| C | Medium | **Operator-injection payload causes 500.** `POST /api/auth/login` with an object as `email` throws `email.toLowerCase is not a function`. The 500 is not exploitable for auth bypass here, but it shows no type validation on inputs. It is a robustness bug and a hint that other endpoints may lack sanitisation. |
| D | Low | **Malformed JSON returns 500** instead of 400. The global error handler does not map body-parser `SyntaxError` (status 400) to a client error. |
| E | Low | `express.json` limit is 500 MB ([app.js:51](backend/app.js#L51)), which is a memory and denial-of-service risk on non-upload routes. |
| F | Low | `GET /` returns `"version":"1.0.1-debug"`. Remove the debug label in production. |
| G | Info | Public routes are reasonably fast, mostly under 350 ms. The slowest were `/api/admin/dashboard/stats` (~2.1s), `/api/config` (~1.6s on first call) and `/api/location/countries` (~0.8s). |
| H | Info | Firebase Admin initialises when `.env` is loaded with `dotenv` (in an earlier run without `.env` it warned about missing credentials). |

Skipped on purpose: `/api/config/matic-price`, `/api/config/exchange-rates`, `/api/admin/dashboard/exchange-rates` (external APIs), `/api/agora/token` and `/api/fix-posts` (writes).

---

## 4. Frontend

### 4.1 Build
`vite build` succeeds. Warning: `agora` chunk is 1.56 MB (436 kB gzip) and the main `index` chunk is 700 kB (203 kB gzip).

### 4.2 Lint (426 errors, 48 warnings, 233 files)

| Rule | Count | Severity | Notes |
|---|---|---|---|
| `no-unused-vars` | 305 | Low | Dead code and imports |
| `react-hooks/rules-of-hooks` | 64 | **High** | Hooks called conditionally, e.g. [CampaignReelCard.jsx:27](frontend/src/modules/user/components/feed/CampaignReelCard.jsx#L27). Can crash React or corrupt state. |
| `react-hooks/exhaustive-deps` | 48 | Medium | Stale-closure risk |
| `react-hooks/set-state-in-effect` | 20 | Low to medium | Extra renders |
| `no-empty` | 11 | Low | Errors swallowed in empty catch blocks |
| `no-undef` | 10 | Low | All in `public/firebase-messaging-sw.js`, service-worker globals, so probably false positives |
| `react-hooks/purity` | 3 | Medium | `Date.now()` in render: [ContentDetailPage.jsx:135](frontend/src/modules/admin/pages/ContentDetailPage.jsx#L135), [ImageEditor.jsx:225](frontend/src/modules/user/components/editor/ImageEditor.jsx#L225), [TaskCard.jsx:13](frontend/src/modules/user/components/tasks/TaskCard.jsx#L13) |
| `no-dupe-keys` | 2 | **Medium (likely bugs)** | Duplicate `loadCampaignSubmissions` in [useAdminStore.js:677](frontend/src/modules/admin/store/useAdminStore.js#L677); duplicate `cancelOffer` in [postService.js:237](frontend/src/modules/user/services/postService.js#L237). The later definition silently wins. |
| `no-constant-binary-expression` | 2 | Medium | Dead `||` fallback: [FinancialManagement.jsx:467](frontend/src/modules/admin/pages/FinancialManagement.jsx#L467), [KycManagement.jsx:358](frontend/src/modules/admin/pages/KycManagement.jsx#L358) |
| `no-useless-catch` | 2 | Low | [useFeedStore.js:410](frontend/src/modules/user/store/useFeedStore.js#L410), [useFeedStore.js:646](frontend/src/modules/user/store/useFeedStore.js#L646) |
| Other | 7 | Low | `react-refresh` (3), `refs` (3), `preserve-manual-memoization` (1) |

### 4.3 Serving the built bundle
- `/`, `/login` and `/admin` all return the SPA shell (title "KnQ Reels").
- `/firebase-messaging-sw.js` is served as JavaScript.
- A request for a non-existent asset (`/assets/nonexist.js`) returns the HTML shell with status 200 instead of 404. This is standard SPA-fallback behaviour but can hide missing-asset errors.
- The frontend `.env` sets `VITE_API_URL=http://localhost:5004/api`, so the built bundle talks to a local backend. That value must change for production. `VITE_ENABLE_WEB3=true` while `VITE_POLYGON_NETWORK` is empty.
- I did not load the UI in a browser, so rendering and user flows are untested.

---

## 5. Smart contracts (Solidity 0.8.24, Hardhat)

All 12 tests pass.

- **KnQNFT (7):** minter set on deploy, minter can mint, non-minter blocked, royalty clamped to 30%, token counter increments, owner can update minter, zero-address minter rejected.
- **KnQAuctionVault (5):** winner can deposit, double deposit prevented, settlement pays creator and commission to treasury, admin refund works, re-settling prevented.
- **Gas:** `mint` about 142k, `settleAuction` about 116k, `depositBid` about 74k.

Gaps: no tests for access control on `settleAuction` and `refundBid`, a failed refund transfer, reentrancy, zero-value deposits, or ERC-2981 royalty info.

---

## 6. Coverage gaps (not tested)

- No automated tests exist for the backend or frontend.
- **Authenticated API flows** were not exercised. I did not log in with the admin or user accounts, because that would write session data to the shared database, and no test database is configured.
- **Payments** (Stripe, Razorpay), **Web3 minting and settlement**, **Agora** tokens, **Cloudinary**, **email** and **push notifications** were not exercised.
- **Socket.IO** (messaging) was not tested.
- **Browser and E2E** testing of the frontend was not performed.

---

## 7. Recommendations (not applied, per instructions)

1. **Immediately:** add auth to `/api/admin/dashboard/*`, and remove or protect `/api/fix-posts`. Decide whether to restore the 48 modified posts from an Atlas backup.
2. Validate input types on auth endpoints (reject non-string `email` and `password`), and map body-parser `SyntaxError` to 400.
3. Reduce the 500 MB JSON limit for non-upload routes.
4. Fix the conditional hook calls (64), the duplicate keys (2) and the dead `||` fallbacks (2).
5. Configure ESLint for the service worker, and clean up unused variables.
6. Create a separate test database (or use `mongodb-memory-server`) so authenticated API tests can run safely. Add backend tests (Jest and Supertest) and frontend tests (Vitest and Playwright).
7. Code-split the `agora` and main bundles.
8. Extend the contract tests to cover the failure paths in Section 5.
