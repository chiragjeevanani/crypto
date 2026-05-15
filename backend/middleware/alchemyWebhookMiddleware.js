const crypto = require("crypto");

/**
 * Middleware to verify Alchemy webhook signatures.
 * Requires ALCHEMY_SIGNING_KEY in environment variables.
 */
const verifyAlchemySignature = (req, res, next) => {
  const signingKey = process.env.ALCHEMY_SIGNING_KEY;

  if (!signingKey) {
    console.error("[Alchemy Webhook] CRITICAL: ALCHEMY_SIGNING_KEY is not set. Security rejection.");
    return res.status(500).json({ 
      success: false, 
      message: "Server configuration error: Webhook security key missing." 
    });
  }

  const signature = req.headers["x-alchemy-signature"];
  if (!signature) {
    console.error("[Alchemy Webhook] Missing x-alchemy-signature header");
    return res.status(401).json({ success: false, message: "Missing signature" });
  }

  // The body must be the raw string for correct HMAC verification
  // Depending on your body-parser setup, you might need to handle this differently
  // Standard express.json() usually provides the parsed object on req.body
  const bodyString = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", signingKey).update(bodyString).digest("hex");

  if (hmac !== signature) {
    console.error("[Alchemy Webhook] Invalid signature. Check ALCHEMY_SIGNING_KEY.");
    return res.status(403).json({ success: false, message: "Invalid signature" });
  }

  next();
};

module.exports = { verifyAlchemySignature };
