const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    razorpayCustomerId: {
        type: String,
        required: true
    },
    tokenId: {
        type: String,
        // required: true,
        // unique: true
    },
    authType: {
        type: String,
        enum: ["netbanking", "debitcard", "upi"],
        required: true
    },
    bankAccount: {
        beneficiary_name: String,
        account_number: String,
        account_type: {
            type: String,
            enum: ["savings", "current"]
        },
        ifsc_code: String
    },
    maxAmount: {
        type: Number,
        required: true
    },
    expireAt: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "revoked", "expired"],
        default: "active"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: Map,
        of: String
    },
    receipt: {
        type: String
    },
    upiRegistrationLink: {
        type: String
    }
});

module.exports = mongoose.model("Order", orderSchema);
