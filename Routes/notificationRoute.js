const express = require("express")
const router = express.Router()
const 
router.post("/send", async(req, res) => {
    
    try {

        const {userId, pushToken, title, body, data} = req.body
        if(!userId || !pushToken || !title || !body || !data) {
            return res.status(402).json({
                success:false,
                message:"All fields required"
            })
        }

        const res = await 
    } catch(err) {

    }
})