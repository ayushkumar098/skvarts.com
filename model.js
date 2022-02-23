const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  name: String,
  cat: String,
  img: {
    data: Buffer,
    contentType: String,
  },
});

module.exports = new mongoose.model("Image", imageSchema);