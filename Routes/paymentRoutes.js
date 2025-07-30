const express = require("express")
const router = express.Router()

const {CreateUser, createOrder, subsequent, fetchPaymentByOrderId} = require("../Controllers/subscription")

router.post("/create-user", CreateUser)
router.post("/create-order", createOrder)
router.post("/create-emandate", subsequent)
router.get("/fetch-token/:order_id", fetchPaymentByOrderId)



module.exports = router