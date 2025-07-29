const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  customerId: { type: String, required: true },
  method: String,
  bank: String,
  status: String,
  recurring: Object,
  createdAt: Date,
  expiredAt: Date
});

module.exports = mongoose.model("Token", tokenSchema);
