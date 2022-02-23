const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  name: String,
  cat: String,
  originalStock: Boolean,
  originalPrice: Number,
  originalSizs: String,
  printStock: Number,
  printPrice:[{daam: Number, size: String}],
  desc: String,
  img: {
    data: Buffer,
    contentType: String,
  }
});

module.exports = new mongoose.model("Photo", photoSchema);