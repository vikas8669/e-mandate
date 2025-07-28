const express = require("express")
const router = express.Router()

const {CreateUser, createOrder, subsequent} = require("../Controllers/subscription")

router.post("/create-user", CreateUser)
router.post("/create-order", createOrder)
router.post("/create-emandate", subsequent)



module.exports = router