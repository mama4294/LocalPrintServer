require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { printLabel } = require("./print");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 30 })); //30 requests per minute max

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.post("/print", (req, res) => {
  const data = req.body;
  const now = new Date();
  console.log(`[${now.toISOString()}] Received print request:`, data);

  //TODO: add error handling to ensure the data is in the correct format

  try {
    printLabel(data); // Call your printer logic
    res.status(200).send("Print job sent!");
  } catch (err) {
    console.error("Error printing:", err);
    res.status(500).send("Failed to print");
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  process.exit(0);
});
