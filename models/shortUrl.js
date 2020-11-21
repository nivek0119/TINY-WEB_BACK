const mongoose = require("mongoose");
const shortId = require("shortid");

const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true,
    unique: true,
  },
  short: {
    type: String,
    required: true,
    unique: true,
    default: shortId.generate,
  },
  clicks: {
    type: Number,
    required: true,
    default: 0,
  },
  email: {
    type: String,
  },
  title: {
    type: String,
  },
});

module.exports = ShortUrl = mongoose.model("ShortUrl", shortUrlSchema);
