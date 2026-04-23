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
    countryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true
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
stateSchema.index({ countryId: 1 });
stateSchema.index({ countryCode: 1 });

module.exports = mongoose.model("State", stateSchema);
