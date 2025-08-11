require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Route
app.post("/print", (req, res) => {
  const now = new Date().toISOString();
  console.log(`[${now}] Received request:`, req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "No data provided" });
  }

  const printerIP = "10.145.0.50";
  const port = 9100;
  const labelsJson = JSON.stringify(req.body);

  // Build PowerShell command
  const psCommand = `powershell -ExecutionPolicy Bypass -File "./print-labels.ps1" -printerIP "${printerIP}" -port ${port} -labelsJson '${labelsJson}'`;

  exec(psCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Print error: ${error.message}`);
      return res
        .status(500)
        .json({ error: "Failed to print label", details: error.message });
    }
    if (stderr) {
      console.error(`⚠️ Print stderr: ${stderr}`);
    }
    console.log(`✅ Print stdout:\n${stdout}`);
    res.json({ message: "Label sent to printer", output: stdout });
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
