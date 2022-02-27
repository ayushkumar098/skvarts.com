const mongoose = require("mongoose");

const originalSchema = new mongoose.Schema({
  name: String,
  cat: String,
  type: String,
  Stock: Number,
  priceInfo: [{ price: Number, size: String }],
  desc: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = new mongoose.model("Original", originalSchema);