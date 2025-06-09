const jwt = require("jsonwebtoken");

// Replace with your actual secret key from env or config
const SECRET_KEY = process.env.JWT_SECRET_KEY;

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    req.user = user; // Attach decoded user info to request
    next();
  });
}

module.exports = authenticateToken;
