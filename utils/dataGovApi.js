const axios = require("axios");
require("dotenv").config();

// API Configuration from environment variables
const API_CONFIG = {
  baseURL: process.env.DATA_GOV_BASE_URL || "https://api.data.gov.in/resource",
  apiKey: process.env.DATA_GOV_API_KEY,
  headers: {
    accept: "application/json",
  },
};

// Validate API key
if (!API_CONFIG.apiKey) {
  throw new Error("DATA_GOV_API_KEY is not defined in environment variables");
}

/**
 * Fetch Historical Commodity Price Data
 * API 1: Past days commodity price details
 * @param {Object} filters - Filter parameters
 * @param {string} filters.state - State name (e.g., 'Gujarat')
 * @param {string} filters.district - District name (e.g., 'Junagarh')
 * @param {string} filters.market - Market name (optional)
 * @param {string} filters.commodity - Commodity name (e.g., 'Soyabean')
 * @param {string} filters.variety - Variety name (optional)
 * @param {string} filters.grade - Grade name (optional)
 * @param {number} limit - Number of records to fetch (default: 2000)
 * @returns {Promise<Object>} API response with historical price data
 */
const fetchHistoricalPrices = async (filters = {}, limit = 2000) => {
  try {
    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters
    if (filters.state) {
      params.append("filters[state.keyword]", filters.state);
    }
    if (filters.district) {
      params.append("filters[district]", filters.district);
    }
    if (filters.market) {
      params.append("filters[market]", filters.market);
    }
    if (filters.commodity) {
      params.append("filters[commodity]", filters.commodity);
    }
    if (filters.variety) {
      params.append("filters[variety]", filters.variety);
    }
    if (filters.grade) {
      params.append("filters[grade]", filters.grade);
    }

    const url = `${API_CONFIG.baseURL}/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
    });

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching historical prices:", error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Fetch Daily Commodity Price Data
 * API 2: Daily price data for specific date
 * @param {Object} filters - Filter parameters
 * @param {string} filters.state - State name (e.g., 'Gujarat')
 * @param {string} filters.district - District name (e.g., 'Amreli')
 * @param {string} filters.commodity - Commodity name (e.g., 'Soyabean')
 * @param {string} filters.arrivalDate - Arrival date (format: 'DD-MM-YYYY', e.g., '10-02-2026')
 * @param {number} limit - Number of records to fetch (default: 3000)
 * @returns {Promise<Object>} API response with daily price data
 */
const fetchDailyPrices = async (filters = {}, limit = 3000) => {
  try {
    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters
    if (filters.state) {
      params.append("filters[State]", filters.state);
    }
    if (filters.district) {
      params.append("filters[District]", filters.district);
    }
    if (filters.commodity) {
      params.append("filters[Commodity]", filters.commodity);
    }
    if (filters.arrivalDate) {
      params.append("filters[Arrival_Date]", filters.arrivalDate);
    }

    const url = `${API_CONFIG.baseURL}/35985678-0d79-46b4-9ed6-6f13308a1d24?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
    });

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching daily prices:", error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

/**
 * Get today's date in DD-MM-YYYY format
 * @returns {string} Formatted date string
 */
const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Fetch today's commodity prices
 * Convenience function to get today's prices
 * @param {Object} filters - Filter parameters (state, district, commodity)
 * @returns {Promise<Object>} API response with today's prices
 */
const fetchTodayPrices = async (filters = {}) => {
  const todayDate = getTodayDate();
  return await fetchDailyPrices({
    ...filters,
    arrivalDate: todayDate,
  });
};

/**
 * Fetch Live Market Data for Today
 * Get all commodities for a specific market on current date
 * @param {Object} marketInfo - Market information
 * @param {string} marketInfo.state - State name
 * @param {string} marketInfo.district - District name
 * @param {string} marketInfo.market - Market name
 * @param {number} limit - Number of records to fetch (default: 3000)
 * @returns {Promise<Object>} API response with today's market data
 */
const fetchLiveMarketData = async (marketInfo = {}, limit = 3000) => {
  try {
    const params = new URLSearchParams({
      "api-key": API_CONFIG.apiKey,
      format: "json",
      limit: limit.toString(),
    });

    // Add filters for specific market
    if (marketInfo.state) {
      params.append("filters[state.keyword]", marketInfo.state);
    }
    if (marketInfo.district) {
      params.append("filters[district]", marketInfo.district);
    }
    if (marketInfo.market) {
      params.append("filters[market]", marketInfo.market);
    }

    const url = `${API_CONFIG.baseURL}/9ef84268-d588-465a-a308-a864a43d0070?${params.toString()}`;

    const response = await axios.get(url, {
      headers: API_CONFIG.headers,
    });

    return {
      success: true,
      data: response.data,
      count: response.data.records?.length || 0,
      marketInfo,
    };
  } catch (error) {
    console.error("Error fetching live market data:", error.message);
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }
};

module.exports = {
  fetchHistoricalPrices,
  fetchDailyPrices,
  fetchTodayPrices,
  fetchLiveMarketData,
  getTodayDate,
};
