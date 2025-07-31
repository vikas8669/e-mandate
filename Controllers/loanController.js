const Loan = require("../Models/instantLoan")
const User = require("../Models/User")
const {sendExpoNotification } = require("../utils/sendPushNotification")


const generateEMISchedule = (startDate, monthlyEMI, tenureMonths) => {
    
    const schedule = []
    
    for (let i = 0; i < tenureMonths; i++) {
        const repaymentDate = new Date(startDate)
        repaymentDate.setMonth(repaymentDate.getMonth() + i)
        schedule.push({
            repaymentDate,
            totalAmount: monthlyEMI,
            principal: monthlyEMI,     
            interest: 0,
            status: "pending",
            lateFee: 0
        })
    }
    return schedule
}

exports.createLoan = async (req, res) => {
    try {
        
        const {
                
            userId,
            principal,
            tenureMonths,
            interestRate,
            monthlyPayment,
            startDate,
            razorpayCustomerId,
            tokenId
        } = req.body

        
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        const emiDetails = generateEMISchedule(new Date(startDate), monthlyPayment, tenureMonths)

        const loan = await Loan.create({
            userId,
            principal,
            tenureMonths,
            interestRate,
            monthlyPayment,
            emiDetails,
            isEmandateActive: !!(razorpayCustomerId && tokenId),
            mandateStatus: (razorpayCustomerId && tokenId) ? "active" : "inactive",
            razorpayCustomerId,
            tokenId
        })

        if(user.pushToken) {
            await sendExpoNotification (
                user._id,
                user.pushToken,
                "Loan Created Successfully",
                `Your loan of ₹${principal} has been created. First EMI on ${new Date(startDate).toDateString()}.`,
            )
        }
        res.status(201).json({ success: true, loan })

    } catch (err) {
        console.error("Loan Creation Error:", err)
        res.status(500).json({ success: false, message: err.message })
    }
}

// exports.updateLoanAfterRecurringPayment = async (req, res) => {
    
//     try {
        
//         const {
//             customer_id,          
//             token_id,             
//             razorpay_payment_id,  
//             razorpay_order_id     
//         } = req.body

//         const loan = await Loan.findOne({ razorpayCustomerId: customer_id, tokenId: token_id })
//         if (!loan) {
//             return res.status(404).json({ success: false, message: "Loan not found" })
//         }

//         const nextEmi = loan.emiDetails.find(emi => emi.status === "pending")
//         if (!nextEmi) {
//             return res.status(400).json({ success: false, message: "No pending EMI found" })
//         }

//         nextEmi.status = "in-progress"
//         // nextEmi.paidDate = new Date()
//         nextEmi.razorpayPaymentId = razorpay_payment_id
//         nextEmi.razorpayOrderId = razorpay_order_id

//         await loan.save()

//         res.status(200).json({ success: true, message: "EMI updated successfully", loan })

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message })
//     }
// }
