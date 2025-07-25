const express = require("express")
const router = express.Router()

const {CreateUser, createOrder, createRegistrationLink} = require("../Controllers/subscription")

router.post("/create-user", CreateUser)
router.post("/create-order", createOrder)
// router.post("/create-upi", createRegistrationLink)



module.exports = router