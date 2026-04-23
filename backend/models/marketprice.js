const mongoose = require("mongoose");

const marketPriceSchema = new mongoose.Schema({
  cropName: String,
  market: String,
  price: Number,
  unit: String,
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MarketPrice", marketPriceSchema);