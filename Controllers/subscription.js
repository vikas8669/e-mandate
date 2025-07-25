const instance = require("../Config/Razorpay")
const User = require("../Models/User")
const Order = require("../Models/Order")



exports.CreateUser = async (req, res) => {

    try {

        const { name, email, contact } = req.body
        if (!name || !email || !contact) {
            return res.status(402).json({
                message: "all filed required"
            })
        }

        const user = await User.findOne({ email })
        if (user) {
            return res.status(402).json({
                success: false,
                message: "User already exist"
            })
        }

        const razorpayCustomer = await instance.customers.create({ name, email, contact })

        const newUser = await User.create({
            name,
            email,
            contact,
            razorpayCustomerId: razorpayCustomer.id
        })

        res.status(201).json({
            success: true, newUser
        })

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// exports.createOrder = async (req, res) => {

//     try {

//         const {
//             customer_id,
//             beneficiary_name,
//             account_number,
//             ifsc_code,
//             max_amount,
//             receipt,
//             authType
//         } = req.body;

//         if (!customer_id || !beneficiary_name || !account_number || !ifsc_code || !max_amount || !authType) {
//             return res.status(400).json({
//                 message: "Missing required fields"
//             });
//         }

//         const order = await instance.orders.create({
//             amount: 0,
//             currency: "INR",
//             payment_capture: true,
//             method: "emandate",
//             customer_id: customer_id,
//             receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
//             notes: {
//                 setup_type: "EMI Auto Debit"
//             },
//             token: {
//                 auth_type: authType,
//                 max_amount: max_amount * 100,
//                 expire_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
//                 notes: {
//                     plan: "EMI Plan",
//                     duration: "12 months"
//                 },
//                 bank_account: {
//                     beneficiary_name: beneficiary_name,
//                     account_number: account_number,
//                     account_type: "savings",
//                     ifsc_code: ifsc_code
//                 }
//             }
//         });

//         return res.status(200).json({
//             success: true,
//             order
//         });

//     } catch (error) {
//         console.error("eMandate Order Error:", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }


exports.createOrder = async (req, res) => {
    try {
        const {
            customer_id,
            beneficiary_name,
            account_number,
            ifsc_code,
            max_amount,
            receipt,
            authType,
            phone,
            email
        } = req.body

        console.log(authType)


        if (!customer_id || !max_amount || !authType) {
            return res.status(400).json({
                message: "Missing required fields"
            })
        }

        if (authType == "upi") {


            console.log("authtype is: ", authType)


            if (!email || !phone || !beneficiary_name) {
                return res.status(400).json({
                    message: "Missing email, phone or name for UPI mandate"
                })
            }

            const registrationLink = await instance.subscriptions.createRegistrationLink({
                customer: {
                    name: beneficiary_name,
                    email,
                    contact: phone
                },
                type: "link",
                amount: max_amount * 100,
                currency: "INR",
                description: "UPI eMandate Auto Debit",
                subscription_registration: {
                    method: "emandate",
                    auth_type: authType,
                    max_amount: max_amount * 100,
                    expire_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                    notes: {
                        plan: "EMI Plan",
                        duration: "12 months"
                    }
                },
                receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`
            });

            return res.status(200).json({
                success: true,
                method: "upi",
                registrationLink
            })
        }

        if (!beneficiary_name || !account_number || !ifsc_code) {
            return res.status(400).json({
                message: "Missing bank account details for mandate setup"
            })
        }

        if (authType !== "netbanking" && authType !== "debitcard") {
            return res.status(400).json({
                message: "Invalid authType for bank mandate. Use 'netbanking' or 'debitcard'"
            })
        }

        const order = await instance.orders.create({
            amount: 0,
            currency: "INR",
            payment_capture: true,
            method: "emandate",
            customer_id,
            receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
            notes: {
                setup_type: "EMI Auto Debit"
            },
            token: {
                auth_type: authType,
                max_amount: max_amount * 100,
                expire_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
                notes: {
                    plan: "EMI Plan",
                    duration: "12 months"
                },
                bank_account: {
                    beneficiary_name,
                    account_number,
                    account_type: "savings",
                    ifsc_code
                }
            }
        })

        return res.status(200).json({
            success: true,
            method: "bank",
            order
        })

    } catch (error) {
        console.error("eMandate Order Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.description || error.message || "internal server error"
        })
    }
}

