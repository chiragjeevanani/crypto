# Backend Analysis + Roadmap (Based on Current Frontend)

## 1) What frontend currently needs from backend

Current frontend is mostly mock/localStorage based but already defines real product flow:

- Auth: sign in / sign up / logout
- User feed: posts, likes, comments, share, gifts, follow
- Campaigns/tasks: admin creates campaign, user sees and joins tasks, voting + winners
- Wallet: INR, crypto, earnings, withdrawal requests
- NFT: listing, buy/resell, commission
- KYC: user submission + admin approval queue
- Admin: users, gifts, campaigns, payouts, moderation, audit logs, settings
- Notifications: premium gifts, campaign updates, general alerts

So backend must replace localStorage services in:

- `frontend/src/modules/admin/services/*`
- `frontend/src/modules/user/store/*` and shared sync files in `frontend/src/shared/*`

---

## 2) Recommended backend folder structure (clean + scalable)

Use feature-based modules, not just flat `controllers/models/routes`.

```txt
backend/
  src/
    app.js
    server.js
    config/
      env.js
      db.js
      logger.js
      blockchain.js
      razorpay.js
    common/
      errors/
        AppError.js
        errorHandler.js
      middleware/
        auth.middleware.js
        role.middleware.js
        validate.middleware.js
        rateLimit.middleware.js
        idempotency.middleware.js
      utils/
        pagination.js
        crypto.js
        time.js
    modules/
      auth/
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.validation.js
        auth.routes.js
      users/
        user.model.js
        user.controller.js
        user.service.js
        user.repository.js
        user.validation.js
        user.routes.js
      campaigns/
        campaign.model.js
        campaignEntry.model.js
        campaignVote.model.js
        campaignWinner.model.js
        campaign.controller.js
        campaign.service.js
        campaign.repository.js
        campaign.validation.js
        campaign.routes.js
      gifts/
        gift.model.js
        giftTransaction.model.js
        gift.controller.js
        gift.service.js
        gift.repository.js
        gift.validation.js
        gift.routes.js
      wallet/
        wallet.model.js
        walletLedger.model.js
        withdrawal.model.js
        wallet.controller.js
        wallet.service.js
        wallet.routes.js
      nft/
        nftAsset.model.js
        nftListing.model.js
        nftTrade.model.js
        nft.controller.js
        nft.service.js
        nft.routes.js
      kyc/
        kycSubmission.model.js
        kyc.controller.js
        kyc.service.js
        kyc.routes.js
      moderation/
        moderationCase.model.js
        moderation.controller.js
        moderation.service.js
        moderation.routes.js
      notifications/
        notification.model.js
        notification.controller.js
        notification.service.js
        notification.routes.js
      audit/
        auditLog.model.js
        audit.controller.js
        audit.service.js
        audit.routes.js
      settings/
        setting.model.js
        setting.controller.js
        setting.service.js
        setting.routes.js
    routes/
      index.js
    jobs/
      campaignWinner.job.js
      payoutSettlement.job.js
      nftSync.job.js
    docs/
      openapi.yaml
  tests/
    unit/
    integration/
```

---

## 3) Naming rules (controllers/models/services)

- Controllers: HTTP only, no business logic  
  Example: `campaign.controller.js -> createCampaign, listCampaigns`
- Services: business rules  
  Example: validate budget, check end date, choose winner logic
- Repositories: DB queries only
- Models: singular and domain based  
  Example: `campaign.model.js`, `kycSubmission.model.js`
- Route naming: REST + versioned  
  Example: `/api/v1/campaigns`, `/api/v1/wallet/withdrawals`

---

## 4) API roadmap (implementation order)

### Phase 1 (MVP core)
- Auth (`/auth/register`, `/auth/login`, `/auth/refresh`)
- User profile
- Campaign CRUD (admin)
- Task list + task detail (user)
- Join campaign + submit proof
- Wallet balances + wallet ledger
- Withdrawal create + admin approve/reject
- Gift catalog + send gift transaction

### Phase 2 (trust + growth)
- Voting endpoints + winner finalization
- KYC submission + admin review
- Notification center + unread count
- Audit log write/read (admin + public transparency)
- Fraud flags (IP/device/duplicate proof detection hooks)

### Phase 3 (NFT + blockchain)
- NFT mint/list/buy/resell endpoints
- Commission settlement
- On-chain tx status sync (Polygon/Ethereum)
- Webhook handlers (payment/blockchain events)

---

## 5) Security checklist (must-have)

- JWT short expiry + refresh token rotation
- Password hashing with `bcrypt` (cost >= 12)
- RBAC (`admin`, `moderator`, `user`)
- Input validation (`zod` or `joi`) on every write API
- Rate limit + brute-force protection on auth and gift endpoints
- Helmet, CORS allowlist, secure headers
- Central error handler (no stack traces in production)
- Idempotency keys for payments, withdrawals, gift sends
- Audit log for admin actions (ban, payout, KYC decisions, campaign edits)
- DB transactions for wallet debit/credit and payout flows
- File upload scanning + MIME/type/size limits
- Store secrets in env/vault, never in repo

---

## 6) Database entities (minimum)

- `User`, `UserSession`
- `Campaign`, `CampaignTask`, `CampaignEntry`, `CampaignVote`, `CampaignWinner`
- `Gift`, `GiftTransaction`
- `Wallet`, `WalletLedger`, `Withdrawal`
- `KycSubmission`
- `NftAsset`, `NftListing`, `NftTrade`
- `Notification`
- `AuditLog`
- `Setting`

---

## 7) Suggested first sprint tasks (practical)

1. Setup Express app skeleton + Mongo connection + module routing.
2. Implement Auth + User module with tests.
3. Implement Campaign module end-to-end (admin create -> user list/detail).
4. Implement Wallet + Gift transactions with atomic ledger writes.
5. Replace frontend campaign/gift/wallet mock services with real API client.

---

## 8) Notes for your current backend folder

Current folders are fine as a start:

- `controllers/`, `models/`, `routes/`, `middleware/`, `utils/`

But for scale and clarity, migrate to `src/modules/<feature>/...` structure above.
This will keep code clean, secure, and easy for multiple developers.
