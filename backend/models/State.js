const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    }
  },
  { timestamps: true }
);

// Index for fast lookup by country
stateSchema.index({ countryCode: 1 });

module.exports = mongoose.model("State", stateSchema);
