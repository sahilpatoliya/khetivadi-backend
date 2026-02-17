const {
  State,
  District,
  Market,
  Commodity,
  Variety,
  Grade,
  MarketPrice,
} = require("../models");
const { getCommodityGujaratiName } = require("./translate");

/**
 * Get or Create State
 * @param {string} stateName - State name
 * @returns {Promise<Object>} State document
 */
const getOrCreateState = async (stateName) => {
  try {
    let state = await State.findOne({ name: stateName });
    if (!state) {
      // States are proper nouns - no translation needed
      state = await State.create({
        name: stateName,
        name_gj: null, // Will be updated manually if needed
      });
      console.log(`✅ Created new state: ${stateName}`);
    }
    return state;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await State.findOne({ name: stateName });
    }
    throw error;
  }
};

/**
 * Get or Create District
 * @param {string} districtName - District name
 * @param {string} stateId - State ObjectId
 * @returns {Promise<Object>} District document
 */
const getOrCreateDistrict = async (districtName, stateId) => {
  try {
    let district = await District.findOne({
      name: districtName,
      state: stateId,
    });
    if (!district) {
      // Districts are proper nouns - no translation needed
      district = await District.create({
        name: districtName,
        name_gj: null, // Will be updated manually if needed
        state: stateId,
      });
      console.log(`✅ Created new district: ${districtName}`);
    }
    return district;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await District.findOne({ name: districtName, state: stateId });
    }
    throw error;
  }
};

/**
 * Get or Create Market
 * @param {string} marketName - Market name
 * @param {string} districtId - District ObjectId
 * @param {string} stateId - State ObjectId
 * @returns {Promise<Object>} Market document
 */
const getOrCreateMarket = async (marketName, districtId, stateId) => {
  try {
    let market = await Market.findOne({
      name: marketName,
      district: districtId,
    });
    if (!market) {
      // Markets are proper nouns - no translation needed
      market = await Market.create({
        name: marketName,
        name_gj: null, // Will be updated manually if needed
        district: districtId,
        state: stateId,
      });
      console.log(`✅ Created new market: ${marketName}`);
    }
    return market;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Market.findOne({ name: marketName, district: districtId });
    }
    throw error;
  }
};

/**
 * Get or Create Commodity
 * @param {string} commodityName - Commodity name
 * @param {number} commodityCode - Commodity code
 * @returns {Promise<Object>} Commodity document
 */
const getOrCreateCommodity = async (commodityName, commodityCode) => {
  try {
    let commodity = await Commodity.findOne({ commodity_code: commodityCode });
    if (!commodity) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(commodityName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for: ${commodityName}`);
      }

      commodity = await Commodity.create({
        name: commodityName,
        name_gj: gujaratiName,
        commodity_code: commodityCode,
      });

      if (gujaratiName) {
        console.log(
          `✅ Created new commodity: ${commodityName} (${gujaratiName}) [${commodityCode}]`,
        );
      } else {
        console.log(
          `✅ Created new commodity: ${commodityName} [${commodityCode}]`,
        );
      }
    }
    return commodity;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Commodity.findOne({ commodity_code: commodityCode });
    }
    throw error;
  }
};

/**
 * Get or Create Variety
 * @param {string} varietyName - Variety name
 * @returns {Promise<Object>} Variety document
 */
const getOrCreateVariety = async (varietyName) => {
  try {
    let variety = await Variety.findOne({ name: varietyName });
    if (!variety) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(varietyName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for variety: ${varietyName}`);
      }

      variety = await Variety.create({
        name: varietyName,
        name_gj: gujaratiName,
      });

      if (gujaratiName) {
        console.log(`✅ Created new variety: ${varietyName} (${gujaratiName})`);
      } else {
        console.log(`✅ Created new variety: ${varietyName}`);
      }
    }
    return variety;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Variety.findOne({ name: varietyName });
    }
    throw error;
  }
};

/**
 * Get or Create Grade
 * @param {string} gradeName - Grade name
 * @returns {Promise<Object>} Grade document
 */
const getOrCreateGrade = async (gradeName) => {
  try {
    let grade = await Grade.findOne({ name: gradeName });
    if (!grade) {
      // Get Gujarati name (with fallback)
      let gujaratiName = null;
      try {
        gujaratiName = await getCommodityGujaratiName(gradeName);
      } catch (error) {
        console.log(`⚠️  Translation skipped for grade: ${gradeName}`);
      }

      grade = await Grade.create({
        name: gradeName,
        name_gj: gujaratiName,
      });

      if (gujaratiName) {
        console.log(`✅ Created new grade: ${gradeName} (${gujaratiName})`);
      } else {
        console.log(`✅ Created new grade: ${gradeName}`);
      }
    }
    return grade;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error, fetch existing
      return await Grade.findOne({ name: gradeName });
    }
    throw error;
  }
};

/**
 * Parse date from DD/MM/YYYY to Date object
 * @param {string} dateStr - Date string in DD/MM/YYYY format
 * @returns {Date} Date object
 */
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
};

/**
 * Process and save a single price record
 * @param {Object} record - Price record from API
 * @returns {Promise<Object>} Result object
 */
const processPriceRecord = async (record) => {
  try {
    // Step 1: Get or create all related entities
    const state = await getOrCreateState(record.State);
    const district = await getOrCreateDistrict(record.District, state._id);
    const market = await getOrCreateMarket(
      record.Market,
      district._id,
      state._id,
    );
    const commodity = await getOrCreateCommodity(
      record.Commodity,
      record.Commodity_Code,
    );
    const variety = await getOrCreateVariety(record.Variety);
    const grade = await getOrCreateGrade(record.Grade);

    // Step 2: Parse arrival date
    const arrivalDate = parseDate(record.Arrival_Date);

    // Step 3: Check if price record already exists
    const existingPrice = await MarketPrice.findOne({
      market: market._id,
      commodity: commodity._id,
      variety: variety._id,
      grade: grade._id,
      arrival_date: arrivalDate,
    });

    if (existingPrice) {
      // Update existing record
      existingPrice.min_price = record.Min_Price;
      existingPrice.max_price = record.Max_Price;
      existingPrice.modal_price = record.Modal_Price;
      await existingPrice.save();
      return { status: "updated", record: existingPrice };
    } else {
      // Create new price record
      const priceRecord = await MarketPrice.create({
        state: state._id,
        district: district._id,
        market: market._id,
        commodity: commodity._id,
        variety: variety._id,
        grade: grade._id,
        arrival_date: arrivalDate,
        min_price: record.Min_Price,
        max_price: record.Max_Price,
        modal_price: record.Modal_Price,
      });
      return { status: "created", record: priceRecord };
    }
  } catch (error) {
    console.error("Error processing record:", error.message);
    return { status: "error", error: error.message, record };
  }
};

/**
 * Process multiple price records in batch
 * @param {Array} records - Array of price records
 * @returns {Promise<Object>} Summary of processing
 */
const processPriceRecordsBatch = async (records) => {
  const results = {
    total: records.length,
    created: 0,
    updated: 0,
    errors: 0,
    errorDetails: [],
  };

  for (const record of records) {
    const result = await processPriceRecord(record);
    if (result.status === "created") {
      results.created++;
    } else if (result.status === "updated") {
      results.updated++;
    } else if (result.status === "error") {
      results.errors++;
      results.errorDetails.push({
        record: record,
        error: result.error,
      });
    }
  }

  return results;
};

module.exports = {
  getOrCreateState,
  getOrCreateDistrict,
  getOrCreateMarket,
  getOrCreateCommodity,
  getOrCreateVariety,
  getOrCreateGrade,
  processPriceRecord,
  processPriceRecordsBatch,
};
