const mongoose = require("mongoose");

const emiSchema = new mongoose.Schema({

    repaymentDate: Date,
    status: {
        type: String,
        enum: ["pending", "paid", "overdue", "in-progress"],
        default: "pending",
    },
    totalAmount: Number,
    principal: { type: Number, default: 0 },
    interest: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    paidDate: Date,
    razorpayOrderId: String,
    razorpayPaymentId: String
});

const instantLoanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    principal: Number,
    tenureMonths: Number,
    interestRate: Number,
    monthlyPayment: Number,

    emiDetails: [emiSchema],

    isEmandateActive: { type: Boolean, default: false },
    mandateStatus: { type: String, default: "inactive" },

    razorpayCustomerId: { type: String },          
    tokenId: { type: String },                     
}, { timestamps: true });

module.exports = mongoose.model("InstantLoan", instantLoanSchema);
