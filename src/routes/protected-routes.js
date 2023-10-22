const express = require("express");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const { learningVideosContent } = require("../utils");
const db = require("../db");

const router = express.Router();

router.get("/get-token-information", verifyAccessToken, (req, res) => {
  res.status(200).json({
    message: "Token details",
    user: req.user,
  });
});

router.get("/get-learning-videos", verifyAccessToken, async (req, res) => {
  try {
    const { resources: learningVideoLinks } = await db
      .getLearningVideosContainer()
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

    const container = await db.getLearningVideosContainer();

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

router.get("/get-learning-content", (req, res) => {
  res.status(200).json(learningVideosContent);
});

router.post("/set-learning-progress", verifyAccessToken, async (req, res) => {
  try {
    const { contentTitle } = req.body;

    if (!contentTitle) {
      return res.status(400).json({ message: "Content title is required" });
    }

    const { resources: userDetails } = await db
      .getUserDetailsContainer()
      .items.query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [
          {
            name: "@email",
            value: req.user.email,
          },
        ],
      })
      .fetchAll();

    if (userDetails.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    userDetails[0].completedTopics?.push(contentTitle);

    const { statusCode } = await db
      .getUserDetailsContainer()
      .item(userDetails[0].id)
      .replace(userDetails[0]);

    if (statusCode !== 200) {
      return res.status(500).json({ message: "Failed to update user details" });
    }

    res.status(200).json({ message: "Learning progress updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update learning progress", error });
  }
});

router.get("/get-learning-progress", verifyAccessToken, async (req, res) => {
  try {
    const { resources: userDetails } = await db
      .getUserDetailsContainer()
      .items.query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [
          {
            name: "@email",
            value: req.user.email,
          },
        ],
      })
      .fetchAll();

    if (userDetails.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const completedTopics = userDetails[0].completedTopics || [];
    const remainedTopics = learningVideosContent.topics.filter(
      (topic) => !completedTopics?.includes(topic)
    );

    const enableCertificate = !Boolean(remainedTopics.length);

    const responseObj = {
      enableCertificate,
      remainedTopics,
      completedTopics,
      allTopics: learningVideosContent.topics,
    };

    res.status(200).json(responseObj);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve learning progress", error });
  }
});

module.exports = router;
