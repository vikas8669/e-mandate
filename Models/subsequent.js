const mongoose = require("mongoose");

const EmandateOrderSchema = new mongoose.Schema({
  amount: Number,
  currency: String,
  payment_capture: Boolean,
  receipt: String,
  notification: {
    token_id: String,
    payment_after: Number
  },
  notes: Object,
  razorpay_order_id: String,
  status: String
}, { timestamps: true });

module.exports = mongoose.model("EmandateOrder", EmandateOrderSchema);
