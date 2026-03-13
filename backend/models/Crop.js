const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema({
  cropName: String,
  category: String,
  quantity: Number,
  price: Number,
  qualityGrade: String,
  farmerId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Crop", cropSchema);