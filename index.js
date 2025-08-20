require("dotenv").config();
const express = require("express");
const rateLimit = require("express-rate-limit");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

//Example:
//POST to http://<server-ip>:3000/print
// Body should be a JSON array of label objects
// Example body:
// [
//   {
//     "title": "Fermentation Sample",
//     "id": "25-HTS-25-F-12hr",
//     "description": "12hr",
//     "location": "Sample Port"
//   }
// ]


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
    return res.status(400).json({ status: "failure", message: "No data provided" });
  }

  const printerIP = "10.145.9.125";
  const port = 9100;
    const labelsJson = JSON.stringify(req.body);

    // Build PowerShell command with valid JSON and escaped double quotes
    const psCommand = `powershell -ExecutionPolicy Bypass -File \"./printMultipleLables.ps1\" -printerIP \"${printerIP}\" -port ${port} -labelsJson \"${labelsJson.replace(/"/g, '\\"')}\"`;

  exec(psCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Print error: ${error.stderr}`);
      return res
        .status(500)
        .json({ status: "failure", 
                message: `Print error: ${stderr}` });
    }

    // Extract number of labels printed from PowerShell stdout
    let numPrinted = null;
    const match = stdout.match(/Parsed (\d+) label/);
    if (match) {
      numPrinted = parseInt(match[1], 10);
    }
    res.json({ status: "success", message: numPrinted==1 ? "1 Label printed": `${numPrinted} Labels printed`});
    console.log(`✅ Printed:\n${numPrinted} labels`);
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
