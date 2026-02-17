require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const connectDB = require("./config/database");
const config = require("./config/config");
const { checkPriceAlerts } = require("./scripts/checkPriceAlertsCron");

// Initialize Express App
const app = express();

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
console.log("⏰ Initializing cron jobs...");

// Price Alert Cron - Runs every hour at minute 0
cron.schedule("0 * * * *", async () => {
  console.log("\n🔔 Running price alert cron job...");
  await checkPriceAlerts();
});

console.log("✅ Cron jobs initialized - Price alerts will check every hour");

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "APMC Khetivadi API is running",
    version: config.apiVersion,
    environment: config.nodeEnv,
    endpoints: {
      health: "/health",
      apiDocs: `/api/${config.apiVersion}`,
      sync: `/api/${config.apiVersion}/sync`,
      marketPrices: `/api/${config.apiVersion}/market-prices`,
    },
    documentation: {
      masterAPI: "https://github.com/your-repo/MASTER_API_GUIDE.md",
      syncAPI: "https://github.com/your-repo/SYNC_API_GUIDE.md",
    },
  });
});

// Health Check Route
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "connected",
    uptime: process.uptime(),
  });
});

// API Routes - Centralized routing
app.use(`/api/${config.apiVersion}`, require("./routes"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: config.nodeEnv === "development" ? err.message : {},
  });
});

// Start Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${config.nodeEnv}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

module.exports = app;
