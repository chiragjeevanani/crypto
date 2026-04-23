const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    currencyCode: {
      type: String,
      required: true,
      trim: true
    },
    currencySymbol: {
      type: String,
      required: true,
      trim: true
    },
    flag: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Country", countrySchema);
