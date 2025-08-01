const mongoose = require("mongoose");

const EmandateSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InstantLoan",
  },

  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },

  customer_id: {
    type: String,
    required: true
  },
  token_id: {
    type: String,
    required: true
  },

  razorpay_payment_id: String,
  razorpay_order_id: {
    type: String,
    unique: true
  },

  status: {
    type: String,
    enum: ["pending", "paid", "overdue", "in-progress"],
    default: "in-progress"
  },

  notification: {
    token_id: String,
    payment_after: Number
  },

  notes: {
    type: Object,
    default: {}
  }

}, { timestamps: true });

module.exports = mongoose.model("Emandate", EmandateSchema);
