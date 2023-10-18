const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cosmosClient = require("../db");

const router = express.Router();
const secretKey = process.env.TOKEN_SECRET_KEY;
const tokenExpiration = process.env.ACCESS_TOKEN_EXPIRATION;
const refreshTokenExpiration = process.env.REFRESH_TOKEN_EXPIRATION;
const databaseId = process.env.COSMOS_DB;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { resources: users } = await cosmosClient
      .database(databaseId)
      .container(process.env.COSMOS_CONTAINER_USER_DETAILS)
      .items.query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [
          {
            name: "@email",
            value: email,
          },
        ],
      })
      .fetchAll();

    if (users?.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = users[0];

    if (!bcrypt.compareSync(password, user.hashedPassword)) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const { email: emailId, username } = users[0];

    const accessToken = jwt.sign({ email: emailId, username }, secretKey, {
      expiresIn: tokenExpiration,
    });

    const refreshToken = jwt.sign({ email: emailId, username }, secretKey, {
      expiresIn: refreshTokenExpiration,
    });

    res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});

router.post("/refresh-token", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  jwt.verify(refreshToken, secretKey, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Refresh token has expired" });
      }
      return res.status(403).json({ message: "Refresh token is invalid" });
    }

    const { email: emailId, username } = user;

    const newAccessToken = jwt.sign({ email: emailId, username }, secretKey, {
      expiresIn: tokenExpiration,
    });

    const newRefreshToken = jwt.sign({ email: emailId, username }, secretKey, {
      expiresIn: refreshTokenExpiration,
    });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  });
});

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the username already exists in the database
    const { resources: existingUsers } = await cosmosClient
      .database(databaseId)
      .container(process.env.COSMOS_CONTAINER_USER_DETAILS)
      .items.query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [
          {
            name: "@email",
            value: email,
          },
        ],
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = {
      username,
      email,
      hashedPassword,
    };

    // Create a new user document in the Cosmos DB
    await cosmosClient
      .database(databaseId)
      .container(process.env.COSMOS_CONTAINER_USER_DETAILS)
      .items.create(newUser);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
});

module.exports = router;
