// const { publicDecrypt } = require("crypto")

const mongoose =  require("mongoose")

const notificationSchema = new mongoose.Schema( {

    uderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    pushToken:{
        type:String,
    },
    title:{
        type:String
    },
    body:{
        type:String
    },
    data:Object,
    status:{
        type:String,
        enum:["sent", "failed", ],
        default:"sent"
    },
    createAt: {
        type:Date,
        default:Date.now()
    }
})

module.exports = mongoose.model("Notification", notificationSchema)