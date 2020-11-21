const mongoose = require("mongoose");

const viewCountSchema = new mongoose.Schema({
    counts: { type: Number }
});

module.exports = ViewCount = mongoose.model("viewCount", viewCountSchema);