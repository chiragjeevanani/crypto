const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "change-me";

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    console.log(`[Auth] ${req.method} ${req.originalUrl} - Incoming Header:`, authHeader ? "Present" : "Missing");
    
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log(`[Auth] ${req.method} ${req.originalUrl} - No Bearer token found`);
      return res.status(401).json({ success: false, message: "Unauthorized - No Token Found" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type === "refresh") {
      return res.status(401).json({ success: false, message: "Use access token for this request" });
    }
    
    console.log(`[Auth] ${req.method} ${req.originalUrl} - Decoded token for user:`, decoded.userId);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error(`[Auth] ${req.method} ${req.originalUrl} - Verification failed:`, error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: `Forbidden: Role '${req.user?.role}' not authorized. Required: ${roles.join(", ")}` 
    });
  }
  return next();
};

module.exports = { protect, authorize };
