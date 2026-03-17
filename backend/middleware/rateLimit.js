const buckets = new Map();

const cleanupIntervalMs = 60 * 1000;
let lastCleanup = Date.now();

const rateLimit = ({ keyPrefix, windowMs, max }) => (req, res, next) => {
  const now = Date.now();
  if (now - lastCleanup > cleanupIntervalMs) {
    for (const [key, value] of buckets.entries()) {
      if (now - value.start > windowMs) buckets.delete(key);
    }
    lastCleanup = now;
  }

  const key = `${keyPrefix}:${req.ip}`;
  const entry = buckets.get(key);
  if (!entry || now - entry.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return next();
  }

  if (entry.count >= max) {
    return res.status(429).json({ success: false, message: "Too many requests. Please try again later." });
  }

  entry.count += 1;
  buckets.set(key, entry);
  return next();
};

module.exports = { rateLimit };
