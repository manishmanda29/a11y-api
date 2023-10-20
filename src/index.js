const express = require("express");
const authRoutes = require("./routes/auth");
const protectedRoutes = require("./routes/protected-routes");
const cors = require("cors");
const app = express();
app.use(cors());
const PORT = process.env.PORT;

app.use(express.json());

app.use("/api/auth", authRoutes); // login, registration
app.use("/api", protectedRoutes);

// Initial point of server
app.listen(PORT, (err) => {
  if (!err) console.log(`Server is running on port ${PORT}`);
  else console.log(`Failed to start server on port ${PORT}`);
});
