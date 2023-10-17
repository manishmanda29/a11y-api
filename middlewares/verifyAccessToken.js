const jwt = require("jsonwebtoken");

const secretKey = process.env.TOKEN_SECRET_KEY;

const verifyAccessToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access token is required" });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(403).json({ message: "Access token has expired" });
      }
      return res.status(403).json({ message: "Access token is invalid" });
    }

    req.user = user;
    next();
  });
};

module.exports = verifyAccessToken;
