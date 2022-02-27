const mongoose = require("mongoose");

const printSchema = new mongoose.Schema({
  name: String,
  cat: String,
  type: String,
  stock: Number,
  priceInfo: [{ price: Number, size: String }],
  desc: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = new mongoose.model("Print", printSchema);