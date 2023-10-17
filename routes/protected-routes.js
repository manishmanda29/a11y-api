const express = require("express");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

const router = express.Router();

router.get("/get-token-information", verifyAccessToken, (req, res) => {
  res.status(200).json({
    message: "Token details",
    user: req.user,
  });
});

module.exports = router;
