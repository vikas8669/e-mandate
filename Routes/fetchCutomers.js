
const express = require("express")
const router = express.Router()
const { getCustomerLoanStats, getSingleCustomer } = require("../Controllers/getCustomerLoanStats")

router.get("/customer-loan-stats", getCustomerLoanStats);
router.get("/single-user/:userId", getSingleCustomer)


module.exports = router