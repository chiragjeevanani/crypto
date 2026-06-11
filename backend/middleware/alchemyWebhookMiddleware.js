// alchemyWebhookMiddleware.js — DEPRECATED (Web3 → Web2 migration)
// Alchemy blockchain event webhooks are no longer used.

const verifyAlchemySignature = (req, res, next) => {
  // No-op stub — Alchemy webhooks are deprecated. Pass through.
  next();
};

module.exports = { verifyAlchemySignature };
