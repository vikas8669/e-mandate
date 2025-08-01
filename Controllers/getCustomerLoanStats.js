const User = require("../Models/User")
const Loan = require("../Models/instantLoan")

exports.getCustomerLoanStats = async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page - 1) * limit

        const totalUsers = await User.countDocuments()
        const users = await User.find().skip(skip).limit(limit)
        const loans = await Loan.find()

        const result = []

        for (const user of users) {
            const userLoans = loans.filter(loan => loan.userId.toString() === user._id.toString())
            // console.log(userLoans)

            let totalLoans = userLoans.length
            let totalDisbursedAmount = 0
            let totalTenureMonths = 0
            let monthlyPayment = 0
            let totalInterestRate = 0
            let paidEMIs = 0
            let pendingEMIs = 0
            let inProgressEMIs = 0
            let overdueEMIs = 0
            let paidAmount = 0
            let pendingAmount = 0
            let lateFee = 0


            for (const loan of userLoans) {
                totalDisbursedAmount += loan.principal
                totalTenureMonths += loan.tenureMonths
                monthlyPayment += loan.monthlyPayment
                totalInterestRate += loan.interestRate

                for (const emi of loan.emiDetails || []) {
                    // console.log(emi.lateFee)
                    lateFee += emi.lateFee

                    if (emi.status === "paid") {
                        paidEMIs++
                        paidAmount += emi.totalAmount
                    } else if (emi.status === "pending") {
                        pendingEMIs++
                        pendingAmount += emi.totalAmount
                    } else if (emi.status === "in-progress") {
                        inProgressEMIs++
                        pendingAmount += emi.totalAmount
                    } else if (emi.status === "overdue") {
                        overdueEMIs++
                        pendingAmount += emi.totalAmount
                    }
                }
            }

            result.push({
                userId: user._id,
                name: user.name,
                email: user.email,
                totalLoans,
                totalDisbursedAmount,
                totalTenureMonths,
                monthlyPayment,
                totalInterestRate,
                emiCounts: {
                    paid: paidEMIs,
                    pending: pendingEMIs,
                    inProgress: inProgressEMIs,
                    overdue: overdueEMIs,
                    lateFee: lateFee,
                },
                amountStats: {
                    paid: paidAmount,
                    pending: pendingAmount
                }
            })
        }

        return res.status(200).json({
            success: true,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit),
            data: result
        })
    } catch (err) {
        console.error("Error getting customer stats:", err)
        return res.status(500).json({
            success: false,
            message: err.message,
        })
    }
}


exports.getSingleCustomer = async (req, res) => {

    try {

        const userId = req.params.userId

        const user = await User.findById(userId)
        if (!user) {
            return res.status(402).json({
                message: "User not found"
            })
        }

        const userLoans = await Loan.find({ userId: userId })

        let totalLoans = userLoans.length
        let totalDisbursedAmount = 0
        let totalTenureMonths = 0
        let monthlyPayment = 0
        let totalInterestRate = 0
        let paidEMIs = 0
        let pendingEMIs = 0
        let inProgressEMIs = 0
        let overdueEMIs = 0
        let paidAmount = 0
        let pendingAmount = 0
        let lateFee = 0

        let loanDetails = []

        for (let loan of userLoans) {
            totalDisbursedAmount += loan.principal
            totalTenureMonths += loan.tenureMonths
            monthlyPayment += loan.monthlyPayment
            totalInterestRate += loan.interestRate


            const emiBreakDown = {
                loanId: loan._id,
                principal: loan.principal,
                interestRate: loan.interestRate,
                tenureMonths: loan.tenureMonths,
                startDate: loan.startDate,
                tokenId: loan.tokenId,
                razorpayCustomerId: loan.razorpayCustomerId,
                emiDetails: [],

            }

            for (let emi of loan.emiDetails || []) {
                emiBreakDown.emiDetails.push(emi)

                if (emi.status === "paid") {
                    paidEMIs++
                    paidAmount += emi.totalAmount
                } else if (emi.status === "pending") {
                    pendingEMIs++
                    pendingAmount += emi.totalAmount
                } else if (emi.status === "in-progress") {
                    inProgressEMIs++
                    pendingAmount += emi.totalAmount
                } else if (emi.status === "overdue") {
                    overdueEMIs++
                    pendingAmount += emi.totalAmount
                }
            }

            loanDetails.push(emiBreakDown)
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,

            },
            loanSummary: {
                totalLoans,
                totalDisbursedAmount,
                emiCounts: {
                    paid: paidEMIs,
                    pending: pendingEMIs,
                    inProgress: inProgressEMIs,
                    overdue: overdueEMIs,
                },
            },
            amountStats: {
                paid: paidAmount,
                pending: pendingAmount,
                lateFee
            },
            loanDetails
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}