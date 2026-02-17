/**
 * Translation Helper
 * Helper utility for English to Gujarati translation
 * Uses free Google Translate API with caching for efficiency
 */

const { translate } = require("@vitalets/google-translate-api");

// In-memory cache for translations
const translationCache = new Map();

// Pre-defined dictionary for common commodities (faster than API calls)
const commodityDictionary = {
  // Grains & Cereals
  wheat: "ઘઉં",
  rice: "ચોખા",
  maize: "મકાઈ",
  bajra: "બાજરી",
  jowar: "જુવાર",
  barley: "જવ",
  ragi: "નાચણી",

  // Pulses
  chickpea: "ચણા",
  lentil: "દાળ",
  pigeon_pea: "તુવેર",
  green_gram: "મગ",
  black_gram: "ઉડદ",
  kidney_bean: "રાજમા",

  // Oilseeds
  groundnut: "મગફળી",
  soybean: "સોયાબીન",
  mustard: "રાઈ",
  sesame: "તલ",
  castor: "એરંડા",
  sunflower: "સૂર્યમુખી",
  safflower: "કરડી",

  // Vegetables
  onion: "ડુંગળી",
  potato: "બટાકા",
  tomato: "ટામેટા",
  garlic: "લસણ",
  ginger: "આદુ",
  chili: "મરચું",
  cabbage: "કોબી",
  cauliflower: "ફૂલકોબી",
  brinjal: "રીંગણ",
  okra: "ભીંડા",
  carrot: "ગાજર",
  radish: "મૂળા",
  cucumber: "કાકડી",
  pumpkin: "કોળું",
  bitter_gourd: "કારેલું",
  bottle_gourd: "દૂધી",
  ridge_gourd: "તોરી",
  peas: "વટાણા",
  beans: "ફળીયા",
  spinach: "પાલક",
  fenugreek: "મેથી",
  coriander: "ધાણા",

  // Fruits
  mango: "કેરી",
  banana: "કેળા",
  apple: "સફરજન",
  orange: "સંતરા",
  papaya: "પપૈયા",
  guava: "જામફળ",
  pomegranate: "દાડમ",
  grapes: "દ્રાક્ષ",
  watermelon: "તરબૂચ",
  coconut: "નાળિયેર",

  // Spices
  turmeric: "હળદર",
  cumin: "જીરું",
  coriander_seed: "ધાણા",
  fenugreek_seed: "મેથી",
  cardamom: "ઇલાયચી",
  clove: "લવીંગ",
  cinnamon: "તજ",
  black_pepper: "મરી",

  // Fiber
  cotton: "કપાસ",
  jute: "જ્યુટ",

  // Others
  sugarcane: "શેરડી",
  sugar: "ખાંડ",
  jaggery: "ગોળ",
  milk: "દૂધ",
  ghee: "ઘી",
};

/**
 * Translate text from English to Gujarati
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @param {string} options.targetLang - Target language code (default: 'gu')
 * @param {boolean} options.useCache - Whether to use cache (default: true)
 * @param {boolean} options.useDictionary - Whether to check dictionary first (default: true)
 * @returns {Promise<string|null>} Translated text or null on error
 */
async function translateText(text, options = {}) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const { targetLang = "gu", useCache = true, useDictionary = true } = options;

  const normalizedText = text.toLowerCase().trim();

  // Check dictionary first (fastest)
  if (useDictionary && commodityDictionary[normalizedText]) {
    return commodityDictionary[normalizedText];
  }

  // Check cache
  const cacheKey = `${normalizedText}_${targetLang}`;
  if (useCache && translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Call API
  try {
    const result = await translate(text, { to: targetLang });
    const translatedText = result.text;

    // Store in cache
    if (useCache) {
      translationCache.set(cacheKey, translatedText);
    }

    return translatedText;
  } catch (error) {
    console.error(`Translation error for "${text}":`, error.message);
    return null;
  }
}

/**
 * Translate multiple texts in batch with delay to avoid rate limiting
 * @param {string[]} texts - Array of texts to translate
 * @param {Object} options - Translation options
 * @param {number} options.delay - Delay between requests in ms (default: 500)
 * @returns {Promise<Object>} Object with original text as key and translation as value
 */
async function translateBatch(texts, options = {}) {
  const { delay = 500, ...translateOptions } = options;
  const results = {};

  for (const text of texts) {
    const translation = await translateText(text, translateOptions);
    results[text] = translation;

    // Add delay to avoid rate limiting
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Get Gujarati name for commodity (uses dictionary first, then API)
 * @param {string} commodityName - English commodity name
 * @returns {Promise<string|null>} Gujarati commodity name
 */
async function getCommodityGujaratiName(commodityName) {
  return await translateText(commodityName, {
    targetLang: "gu",
    useCache: true,
    useDictionary: true,
  });
}

/**
 * Add custom translation to dictionary
 * @param {string} english - English text
 * @param {string} gujarati - Gujarati translation
 */
function addToDictionary(english, gujarati) {
  const normalizedKey = english.toLowerCase().trim();
  commodityDictionary[normalizedKey] = gujarati;
  console.log(`Added to dictionary: ${english} → ${gujarati}`);
}

/**
 * Get current dictionary
 * @returns {Object} Current translation dictionary
 */
function getDictionary() {
  return { ...commodityDictionary };
}

/**
 * Clear translation cache
 */
function clearCache() {
  translationCache.clear();
  console.log("Translation cache cleared");
}

/**
 * Get cache size
 * @returns {number} Number of cached translations
 */
function getCacheSize() {
  return translationCache.size;
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    cacheSize: translationCache.size,
    dictionarySize: Object.keys(commodityDictionary).length,
  };
}

/**
 * Translate with fallback to English if translation fails
 * @param {string} text - Text to translate
 * @param {Object} options - Translation options
 * @returns {Promise<string>} Translated text or original text
 */
async function translateWithFallback(text, options = {}) {
  const translation = await translateText(text, options);
  return translation || text;
}

/**
 * Check if translation exists in dictionary
 * @param {string} text - Text to check
 * @returns {boolean} True if exists in dictionary
 */
function isInDictionary(text) {
  const normalizedText = text.toLowerCase().trim();
  return commodityDictionary.hasOwnProperty(normalizedText);
}

/**
 * Get translation from dictionary only (no API call)
 * @param {string} text - Text to translate
 * @returns {string|null} Translation or null if not in dictionary
 */
function getFromDictionary(text) {
  const normalizedText = text.toLowerCase().trim();
  return commodityDictionary[normalizedText] || null;
}

module.exports = {
  translateText,
  translateBatch,
  getCommodityGujaratiName,
  addToDictionary,
  getDictionary,
  clearCache,
  getCacheSize,
  getCacheStats,
  translateWithFallback,
  isInDictionary,
  getFromDictionary,
  commodityDictionary,
};
