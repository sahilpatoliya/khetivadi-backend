const mongoose = require("mongoose");

const commoditySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Commodity name is required"],
      trim: true,
    },
    name_gj: {
      type: String,
      trim: true,
    },
    commodity_code: {
      type: Number,
      required: [true, "Commodity code is required"],
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
commoditySchema.index({ name: 1 });

module.exports = mongoose.model("Commodity", commoditySchema);
