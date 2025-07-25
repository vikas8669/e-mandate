const mongoose = require("mongoose")
require("dotenv").config()


const dbConnect = async(req, res) => {

    try {

        await mongoose.connect(process.env.MONGO_URL)
        console.log("DB connected")
    } catch(err) {
        console.log(err)
        process.exit(1)
    }
}

module.exports = dbConnect