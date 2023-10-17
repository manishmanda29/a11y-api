const express = require("express");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const cosmosClient = require("../db");

const router = express.Router();

router.get("/get-token-information", verifyAccessToken, (req, res) => {
  res.status(200).json({
    message: "Token details",
    user: req.user,
  });
});

router.get("/get-learning-videos", verifyAccessToken, async (req, res) => {
  try {
    const { resources: learningVideoLinks } = await cosmosClient
      .database(process.env.COSMOS_DB)
      .container(process.env.COSMOS_CONTAINER_LEARNING_VIDEOS)
      .items.readAll()
      .fetchAll();

    res.status(200).json({ data: learningVideoLinks });
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve data", error });
  }
});

// api only accessible to admin
router.post("/post-learning-videos", verifyAccessToken, async (req, res) => {
  const { videoLinks } = req.body;

  try {
    if (!Array.isArray(videoLinks) || videoLinks.length === 0) {
      return res.status(400).json({ message: "Invalid or empty input" });
    }

    const container = await cosmosClient
      .database(process.env.COSMOS_DB)
      .container(process.env.COSMOS_CONTAINER_LEARNING_VIDEOS);

    const results = [];

    for (const link of videoLinks) {
      const item = { link, timestamp: new Date().toISOString() };

      const { resource } = await container.items.create(item);

      results.push(resource);
    }

    res.status(201).json({ message: "Links inserted successfully", results });
  } catch (error) {
    res.status(500).json({ message: "Failed to insert links", error });
  }
});

module.exports = router;
