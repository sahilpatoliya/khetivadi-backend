const express = require("express");
const router = express.Router();
const syncController = require("../controllers/syncController");

/**
 * ========================================
 * DATA SYNCHRONIZATION API ROUTES
 * Base: /api/v1/sync
 * ========================================
 */

// ============================================
// DATA SYNC ENDPOINTS
// ============================================

/**
 * @route   POST /api/v1/sync/yesterday
 * @desc    Sync yesterday's market price data for Gujarat
 * @body    { state: "Gujarat" } (optional, defaults to Gujarat)
 * @access  Public
 */
router.post("/yesterday", syncController.syncYesterdayData);

/**
 * @route   POST /api/v1/sync/date
 * @desc    Sync market price data for a specific date
 * @body    { date: "DD-MM-YYYY", state: "Gujarat" }
 * @access  Public
 */
router.post("/date", syncController.syncSpecificDate);

// ============================================
// SYNC STATUS ENDPOINTS
// ============================================

/**
 * @route   GET /api/v1/sync/status
 * @desc    Get sync status and database statistics (total records, entities count)
 * @access  Public
 */
router.get("/status", syncController.getSyncStatus);

module.exports = router;
