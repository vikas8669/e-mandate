const mongoose = require("mongoose")

const UserSchema = mongoose.Schema( {
     name: String,
  email: { type: String, unique: true },
  contact: String,
  razorpayCustomerId: String,
  pushToken: {
    type: String
}
})

module.exports = mongoose.model("User", UserSchema)