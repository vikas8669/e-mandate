const express = require("express")
const router = express.Router()

const {createLoan, updateLoanAfterRecurringPayment} = require("../Controllers/loanController")


router.post("/create-loan", createLoan)
// router.post("/emi-payment", updateLoanAfterRecurringPayment)

module.exports = router