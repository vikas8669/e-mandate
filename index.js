const express = require("express")
const app = express()
const dbConnect = require("./Config/db")

const createSubscription = require("./Routes/paymentRoutes")
const createLoan = require("./Routes/createLoan")
require("dotenv").config()
app.use(express.json())

dbConnect()

const PORT = process.env.PORT || 3000


app.use("/api",createSubscription)
app.use("/api", createLoan)



app.listen(PORT, () => {
    console.log("server start at", PORT)
})

app.get("/", (req, res) => {
    res.send("hello node")
})