const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "change-me";

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type === "refresh") {
      return res.status(401).json({ success: false, message: "Use access token for this request" });
    }
    req.user = decoded;
    return next();
  } catch (error) {
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
