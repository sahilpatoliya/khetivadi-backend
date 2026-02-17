const { fetchDailyPrices } = require("../utils/dataGovApi");
const { processPriceRecordsBatch } = require("../utils/dataProcessor");

/**
 * Get yesterday's date in DD-MM-YYYY format
 * @returns {string} Yesterday's date
 */
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = String(yesterday.getDate()).padStart(2, "0");
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const year = yesterday.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Sync yesterday's price data for Gujarat state
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.syncYesterdayData = async (req, res) => {
  try {
    const yesterdayDate = getYesterdayDate();

    console.log(`\n🔄 Syncing data for Gujarat - ${yesterdayDate}\n`);

    // Fetch data from Data.gov.in API
    const apiResult = await fetchDailyPrices(
      {
        state: "Gujarat",
        arrivalDate: yesterdayDate,
      },
      3000,
    );

    if (!apiResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from API",
        error: apiResult.error,
      });
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        message: "No records found for yesterday",
        date: yesterdayDate,
        count: 0,
      });
    }

    console.log(`📥 Fetched ${records.length} records from API`);
    console.log(`📊 Processing records...\n`);

    // Process all records
    const results = await processPriceRecordsBatch(records);

    console.log(`\n✅ Processing completed!`);
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors}`);

    return res.json({
      success: true,
      message: "Data synced successfully",
      date: yesterdayDate,
      state: "Gujarat",
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      errorDetails:
        results.errorDetails.length > 0 ? results.errorDetails : undefined,
    });
  } catch (error) {
    console.error("❌ Error syncing data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error syncing data",
      error: error.message,
    });
  }
};

/**
 * Sync data for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.syncSpecificDate = async (req, res) => {
  try {
    const { date, state = "Gujarat" } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required (format: DD-MM-YYYY)",
      });
    }

    console.log(`\n🔄 Syncing data for ${state} - ${date}\n`);

    // Fetch data from Data.gov.in API
    const apiResult = await fetchDailyPrices(
      {
        state,
        arrivalDate: date,
      },
      3000,
    );

    if (!apiResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch data from API",
        error: apiResult.error,
      });
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      return res.json({
        success: true,
        message: "No records found for the specified date",
        date,
        state,
        count: 0,
      });
    }

    console.log(`📥 Fetched ${records.length} records from API`);
    console.log(`📊 Processing records...\n`);

    // Process all records
    const results = await processPriceRecordsBatch(records);

    console.log(`\n✅ Processing completed!`);
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Errors: ${results.errors}`);

    return res.json({
      success: true,
      message: "Data synced successfully",
      date,
      state,
      summary: {
        total: results.total,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      },
      errorDetails:
        results.errorDetails.length > 0 ? results.errorDetails : undefined,
    });
  } catch (error) {
    console.error("❌ Error syncing data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error syncing data",
      error: error.message,
    });
  }
};

/**
 * Get sync status and statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const {
      State,
      District,
      Market,
      Commodity,
      Variety,
      Grade,
      MarketPrice,
    } = require("../models");

    const stats = {
      states: await State.countDocuments(),
      districts: await District.countDocuments(),
      markets: await Market.countDocuments(),
      commodities: await Commodity.countDocuments(),
      varieties: await Variety.countDocuments(),
      grades: await Grade.countDocuments(),
      priceRecords: await MarketPrice.countDocuments(),
    };

    // Get latest price record date
    const latestRecord = await MarketPrice.findOne()
      .sort({ arrival_date: -1 })
      .select("arrival_date");

    return res.json({
      success: true,
      statistics: stats,
      latestDataDate: latestRecord?.arrival_date || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching sync status",
      error: error.message,
    });
  }
};
