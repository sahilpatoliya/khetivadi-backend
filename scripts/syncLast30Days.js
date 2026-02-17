require("dotenv").config();
const connectDB = require("../config/database");
const { fetchDailyPrices } = require("../utils/dataGovApi");
const { processPriceRecordsBatch } = require("../utils/dataProcessor");

/**
 * Format date to DD-MM-YYYY
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Get array of last N days
 * @param {number} days - Number of days
 * @returns {Array} Array of date strings
 */
const getLastNDays = (days) => {
  const dates = [];
  const today = new Date();

  for (let i = days; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(formatDate(date));
  }

  return dates;
};

/**
 * Sync data for a specific date
 * @param {string} date - Date in DD-MM-YYYY format
 * @param {string} state - State name
 * @returns {Promise<Object>} Sync result
 */
const syncDateData = async (date, state = "Gujarat") => {
  try {
    console.log(`\n📅 Syncing data for ${state} - ${date}`);

    // Fetch data from API
    const apiResult = await fetchDailyPrices(
      {
        state,
        arrivalDate: date,
      },
      3000,
    );

    if (!apiResult.success) {
      return {
        date,
        success: false,
        error: apiResult.error,
        records: 0,
      };
    }

    const records = apiResult.data.records;

    if (!records || records.length === 0) {
      console.log(`   ⚠️  No records found`);
      return {
        date,
        success: true,
        records: 0,
        created: 0,
        updated: 0,
        errors: 0,
      };
    }

    console.log(`   📥 Fetched ${records.length} records`);
    console.log(`   ⚙️  Processing...`);

    // Process records
    const results = await processPriceRecordsBatch(records);

    console.log(`   ✅ Created: ${results.created}`);
    console.log(`   🔄 Updated: ${results.updated}`);
    if (results.errors > 0) {
      console.log(`   ❌ Errors: ${results.errors}`);
    }

    return {
      date,
      success: true,
      records: results.total,
      created: results.created,
      updated: results.updated,
      errors: results.errors,
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return {
      date,
      success: false,
      error: error.message,
      records: 0,
    };
  }
};

/**
 * Sync last N days data
 * @param {number} days - Number of days to sync (default: 30)
 */
const syncLast30Days = async (days = 30) => {
  try {
    // Connect to database
    await connectDB();

    console.log("\n" + "=".repeat(70));
    console.log(`🚀 Starting sync for last ${days} days - Gujarat State`);
    console.log("=".repeat(70));

    const dates = getLastNDays(days);
    const summary = {
      totalDays: days,
      successfulDays: 0,
      failedDays: 0,
      totalRecords: 0,
      totalCreated: 0,
      totalUpdated: 0,
      totalErrors: 0,
      daysWithNoData: 0,
      results: [],
    };

    const startTime = Date.now();

    // Process each day sequentially
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      console.log(`\n[${i + 1}/${dates.length}] ` + "━".repeat(50));

      const result = await syncDateData(date);
      summary.results.push(result);

      if (result.success) {
        summary.successfulDays++;
        summary.totalRecords += result.records;
        summary.totalCreated += result.created || 0;
        summary.totalUpdated += result.updated || 0;
        summary.totalErrors += result.errors || 0;

        if (result.records === 0) {
          summary.daysWithNoData++;
        }
      } else {
        summary.failedDays++;
      }

      // Small delay between requests to avoid rate limiting
      if (i < dates.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print final summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 FINAL SUMMARY");
    console.log("=".repeat(70));
    console.log(`⏱️  Total Time: ${duration} seconds`);
    console.log(`📅 Days Processed: ${summary.totalDays}`);
    console.log(`✅ Successful Days: ${summary.successfulDays}`);
    console.log(`❌ Failed Days: ${summary.failedDays}`);
    console.log(`⚠️  Days with No Data: ${summary.daysWithNoData}`);
    console.log(`\n📈 Records Summary:`);
    console.log(`   Total Records: ${summary.totalRecords}`);
    console.log(`   Created: ${summary.totalCreated}`);
    console.log(`   Updated: ${summary.totalUpdated}`);
    console.log(`   Errors: ${summary.totalErrors}`);

    // Show failed days if any
    if (summary.failedDays > 0) {
      console.log(`\n❌ Failed Days:`);
      summary.results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(`   ${r.date}: ${r.error}`);
        });
    }

    // Show days with no data
    if (summary.daysWithNoData > 0) {
      console.log(`\n⚠️  Days with No Data:`);
      summary.results
        .filter((r) => r.success && r.records === 0)
        .forEach((r) => {
          console.log(`   ${r.date}`);
        });
    }

    console.log("\n" + "=".repeat(70));
    console.log("✨ Sync completed successfully!");
    console.log("=".repeat(70) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
    process.exit(1);
  }
};

// Get number of days from command line argument or default to 30
const daysToSync = process.argv[2] ? parseInt(process.argv[2]) : 30;

if (isNaN(daysToSync) || daysToSync < 1 || daysToSync > 365) {
  console.error(
    "❌ Invalid number of days. Please provide a number between 1 and 365",
  );
  process.exit(1);
}

// Run the sync
syncLast30Days(daysToSync);
