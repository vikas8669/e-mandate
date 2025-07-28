const instance = require("../Config/Razorpay")
const User = require("../Models/User")
const Order = require("../Models/Order")
const Emandate = require("../Models/subsequent")

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
//         } = req.body

//         if (!customer_id || !beneficiary_name || !account_number || !ifsc_code || !max_amount || !authType) {
//             return res.status(400).json({
//                 message: "Missing required fields"
//             })
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
//         })

//         return res.status(200).json({
//             success: true,
//             order
//         })

//     } catch (error) {
//         console.error("eMandate Order Error:", error)
//         return res.status(500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

// exports.CreateUser = async (req, res) => {

//     try {

//         const { name, email, contact } = req.body
//         if (!name || !email || !contact) {
//             return res.status(402).json({
//                 message: "all filed required"
//             })
//         }

//         const user = await User.findOne({ email })
//         if (user) {
//             return res.status(402).json({
//                 success: false,
//                 message: "User already exist"
//             })
//         }

//         const razorpayCustomer = await instance.customers.create({ name, email, contact })

//         const newUser = await User.create({
//             name,
//             email,
//             contact,
//             razorpayCustomerId: razorpayCustomer.id
//         })

//         res.status(201).json({
//             success: true, newUser
//         })

//     } catch (err) {
//         console.log(err)
//         return res.status(500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

// exports.createOrder = async (req, res) => {

//     try {

//         const {
//             method,
//             customer_id,
//             // beneficiary_name,
//             // account_number,
//             // ifsc_code,
//             max_amount,
//             receipt,
//             // authType,
//             phone,
//             email
//         } = req.body

//         if (!method || !customer_id || !max_amount) {
//             return res.status(400).json({
//                 message: "Missing required fields"
//             })
//         }

//         if (method === "upi") {
//             if (!email || !phone  || !customer_id) {
//                 return res.status(400).json({
//                     message: "Missing email, phone or name for UPI mandate"
//                 })
//             }

//             // const upiExpireAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 // 1 year in seconds

//             const registrationLink = await instance.subscriptions.createRegistrationLink({
//                 customer: {
//                     // name: beneficiary_name,
//                     email,
//                     contact: phone
//                 },
//                 type: "link",
//                 amount: 100 * 100, 
//                 currency: "INR",
//                 description: "UPI eMandate Auto Debit",
//                 receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
//                 notes: {
//                     notes_key_1: "Tea, Earl Grey, Hot",
//                     notes_key_2: "Tea, Earl Grey… decaf."
//                 }
//             })

//             return res.status(200).json({
//                 success: true,
//                 // method: "upi",
//                 registrationLink
//             })
//         }

//         // if (!beneficiary_name || !account_number || !ifsc_code) {
//         //     return res.status(400).json({
//         //         message: "Missing bank account details for mandate setup"
//         //     })
//         // }

//         if (!["netbanking", "debitcard"].includes(authType)) {
//             return res.status(400).json({
//                 message: "Invalid authType for bank mandate. Use 'netbanking' or 'debitcard'"
//             })
//         }

//         const order = await instance.orders.create({
//             amount: 0,
//             currency: "INR",
//             payment_capture: true,
//             method: authType,
//             customer_id,
//             receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
//             notes: {
//                 setup_type: "EMI Auto Debit"
//             },
//             token: {
//                 auth_type: authType,
//                 max_amount: max_amount,
//                 expire_at: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
//                 notes: {
//                     plan: "EMI Plan",
//                     duration: "12 months"
//                 },
//                 bank_account: {
//                     beneficiary_name,
//                     account_number,
//                     account_type: "savings",
//                     ifsc_code
//                 }
//             }
//         })

//         const fetchTokenByCustomer = async (customer_id) => {
//             try {
//                 const tokens = await instance.customers.fetchTokens(customer_id)
//                 return tokens.items.length ? tokens.items[0] : null
//             } catch (err) {
//                 console.error("Token fetch error:", err.message)
//                 return null
//             }
//         }

//         const token = await fetchTokenByCustomer(customer_id)
//         console.log("token here: ", token)
//         if (!token) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Token not yet available"
//             })
//         }



//         const newOrder = new Order({
//             razorpayCustomerId: customer_id,
//             tokenId: token?.id,
//             authType,
//             bankAccount: {
//                 beneficiary_name,
//                 account_number,
//                 account_type: "savings",
//                 ifsc_code
//             },
//             maxAmount: max_amount,
//             expireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
//             status: "active",
//             notes: {
//                 plan: "EMI Plan",
//                 duration: "12 months"
//             }
//         })

//         await newOrder.save()

//         return res.status(200).json({
//             success: true,
//             order,
//             token: token,
//             message: token
//         })

//     } catch (error) {
//         console.error("eMandate Order Error:", error)
//         return res.status(500).json({
//             success: false,
//             message: error?.description || error.message || "internal server error"
//         })
//     }
// }

// // exports.createOrder = async (req, res) => {
// //   try {
// //     const {
// //       method,
// //       customer_id,
// //       beneficiary_name,
// //       account_number,
// //       ifsc_code,
// //       max_amount,
// //       receipt,
// //       authType,
// //       contact,
// //       email,
// //       notes
// //     } = req.body

// //     if (!method || !customer_id || !max_amount) {
// //       return res.status(400).json({
// //         message: "Missing required fields: method, customer_id, or max_amount"
// //       })
// //     }

// //     const expire_at = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60

// //     // -------------------- UPI FLOW --------------------
// //     if (method === "upi") {
// //       if (!email || !contact || !beneficiary_name) {
// //         return res.status(400).json({
// //           message: "Missing email, phone or name for UPI mandate"
// //         })
// //       }

// //       const registrationLink = await instance.subscriptions.createRegistrationLink({
// //         customer: {
// //           name: beneficiary_name,
// //           email,
// //           contact: contact
// //         },
// //         type: "link",
// //         amount: 100, // Optional initial amount
// //         currency: "INR",
// //         description: `UPI eMandate Auto Debit for ${beneficiary_name}`,
// //         subscription_registration: {
// //       method: "upi",
// //       max_amount: max_amount * 100,
// //       expire_at,
// //       frequency: "monthly",         // ✅ required
// //       recurring_type: "on",         // ✅ fixed day debit
// //       recurring_value: 1,           // ✅ 5th of every month
// //       notes: {
// //         plan: "EMI Plan",
// //         duration: "12 months"
// //       }
// //     },
// //         receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
// //         email_notify: true,
// //         sms_notify: true,
// //         expire_by: expire_at,
// //         notes: {
// //           plan: "EMI Plan",
// //           duration: "12 months",
// //           ...notes
// //         }
// //       })

// //       // Save to DB if needed
// //       const newOrder = new Order({
// //         razorpayCustomerId: customer_id,
// //         method: "upi",
// //         authType: "upi",
// //         maxAmount: max_amount,
// //         status: "pending",
// //         expireAt: new Date(expire_at * 1000),
// //         notes: {
// //           plan: "EMI Plan",
// //           duration: "12 months"
// //         },
// //         upiRegistrationLink: registrationLink.short_url || registrationLink.url,
// //         receipt
// //       })

// //       await newOrder.save()

// //       return res.status(200).json({
// //         success: true,
// //         message: "UPI eMandate registration link created",
// //         registrationLink
// //       })
// //     }

// //     // -------------------- NETBANKING / DEBITCARD FLOW --------------------
// //     if (!authType || !["netbanking", "debitcard"].includes(authType)) {
// //       return res.status(400).json({
// //         message: "Invalid or missing authType. Use 'netbanking' or 'debitcard'"
// //       })
// //     }

// //     if (!beneficiary_name || !account_number || !ifsc_code) {
// //       return res.status(400).json({
// //         message: "Missing bank account details for bank mandate"
// //       })
// //     }

// //     const order = await instance.orders.create({
// //       amount: 0,
// //       currency: "INR",
// //       payment_capture: 1,
// //       method: "emandate",
// //       customer_id,
// //       receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
// //       notes: {
// //         setup_type: "EMI Auto Debit",
// //         ...notes
// //       },
// //       token: {
// //         auth_type: authType,
// //         max_amount: max_amount,
// //         expire_at,
// //         notes: {
// //           plan: "EMI Plan",
// //           duration: "12 months"
// //         },
// //         bank_account: {
// //           beneficiary_name,
// //           account_number,
// //           account_type: "savings",
// //           ifsc_code
// //         }
// //       }
// //     })

// //     // Fetch active token
// //     const fetchTokenByCustomer = async (customer_id) => {
// //       try {
// //         const tokens = await instance.customers.fetchTokens(customer_id)
// //         return tokens.items.length ? tokens.items[0] : null
// //       } catch (err) {
// //         console.error("Token fetch error:", err.message)
// //         return null
// //       }
// //     }

// //     const token = await fetchTokenByCustomer(customer_id)
// //     if (!token) {
// //       return res.status(202).json({
// //         success: true,
// //         message: "Order created but token not yet active. Monitor via webhook or polling.",
// //         order
// //       })
// //     }

// //     // Save to DB
// //     const newOrder = new Order({
// //       razorpayCustomerId: customer_id,
// //       tokenId: token.id,
// //       method,
// //       authType,
// //       bankAccount: {
// //         beneficiary_name,
// //         account_number,
// //         account_type: "savings",
// //         ifsc_code
// //       },
// //       maxAmount: max_amount,
// //       expireAt: new Date(expire_at * 1000),
// //       status: "active",
// //       notes: {
// //         plan: "EMI Plan",
// //         duration: "12 months"
// //       },
// //       receipt
// //     })

// //     await newOrder.save()

// //     return res.status(200).json({
// //       success: true,
// //       message: "eMandate order created and token saved",
// //       order,
// //       token
// //     })

// //   } catch (error) {
// //     console.error("eMandate Order Error:", error)
// //     return res.status(500).json({
// //       success: false,
// //       message: error?.description || error.message || "Internal server error"
// //     })
// //   }
// // }

// exports.subsequent = async (req, res) => {

//     try {

//         const { amount, currency, payment_capture, receipt, notification, notes } = req.body

//         if (!amount || !currency || !payment_capture || !receipt || !notification || !notification.token_id || !notification.payment_after) {
//             return res.status(400).json({
//                 success: false,
//                 message: "All required fields must be provided"
//             })
//         }

//         const order = await instance.orders.create({
//             amount,
//             currency,
//             payment_capture,
//             receipt,
//             notification,
//             notes
//         })


//         const savedOrder = await Emandate.create({
//             amount,
//             currency,
//             payment_capture,
//             receipt,
//             notification,
//             notes,
//             razorpay_order_id: order.id,
//             status: order.status
//         })

//         res.status(201).json({
//             success: true,
//             message: "eMandate order created successfully",
//             data: savedOrder
//         })

//     } catch (err) {
//         console.log(err)
//         return res.status(500).json({
//             message: err.message
//         })

//     }
// }



const fetchTokenByCustomer = async (customer_id) => {

    try {

        const tokens = await instance.customers.fetchTokens(customer_id)
        return tokens.items.length ? tokens.items[0] : null
    } catch (err) {
        console.error("Token fetch error:", err.message)
        return null
    }
}

exports.CreateUser = async (req, res) => {
    
    try {
        
        const { name, email, contact } = req.body
        if (!name || !email || !contact) {
            return res.status(402).json({ message: "All fields required" })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(402).json({ success: false, message: "User already exists" })
        }

        const razorpayCustomer = await instance.customers.create({ name, email, contact })

        const newUser = await User.create({
            name,
            email,
            contact,
            razorpayCustomerId: razorpayCustomer.id
        })

        res.status(201).json({ success: true, newUser })
    } catch (err) {
        console.log(err)
        res.status(500).json({ success: false, message: err.message })
    }
}


exports.createOrder = async (req, res) => {

    try {

        const {
            method,
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

        if (!method || !customer_id || !max_amount) {
            return res.status(400).json({ 
                message: "Missing required fields" 
            })
        }

        const expire_at = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60

        if (method === "upi") {
            if (!email || !phone) {
                return res.status(400).json({ 
                    message: "Missing email or phone for UPI mandate" 
                })
            }

            const registrationLink = await instance.subscriptions.createRegistrationLink({
                customer: {
                    email,
                    contact: phone
                },
                type: "link",
                amount: 100 * 100,
                currency: "INR",
                description: "UPI eMandate Auto Debit",
                subscription_registration: {
                    method: "upi",
                    max_amount: max_amount * 100,
                    expire_at,
                    frequency: "monthly",
                    notes: {
                        plan: "EMI Plan",
                        duration: "12 months"
                    }
                },
                receipt: receipt || `rcpt_${Math.random().toString(36).slice(2)}`,
                email_notify: true,
                sms_notify: true,
                expire_by: expire_at
            })

            const newOrder = new Order({
                razorpayCustomerId: customer_id,
                method: "upi",
                authType: "upi",
                maxAmount: max_amount,
                // status: "pending",
                expireAt: new Date(expire_at * 1000),
                notes: {
                    plan: "EMI Plan",
                    duration: "12 months"
                },
                upiRegistrationLink: registrationLink.short_url || registrationLink.url,
                receipt
            })

            await newOrder.save()

            return res.status(200).json({ success: true, registrationLink })
        }

        if (!authType || !["netbanking", "debitcard"].includes(authType)) {
            return res.status(400).json({ message: "Invalid authType" })
        }

        if (!beneficiary_name || !account_number || !ifsc_code) {
            return res.status(400).json({ message: "Missing bank details for mandate" })
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
                expire_at,
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

        
        
        const token = await fetchTokenByCustomer(customer_id)
        console.log("Token here: ", token)
        if (!token) {
            return res.status(400).json({ success: false, message: "Token not yet available" })
        }

        const newOrder = new Order({
            razorpayCustomerId: customer_id,
            tokenId: token.id,
            method,
            authType,
            bankAccount: {
                beneficiary_name,
                account_number,
                account_type: "savings",
                ifsc_code
            },
            maxAmount: max_amount,
            expireAt: new Date(expire_at * 1000),
            status: "active",
            notes: {
                plan: "EMI Plan",
                duration: "12 months"
            },
            receipt
        })

        await newOrder.save()

        res.status(200).json({ success: true, order, token })
    } catch (error) {
        console.error("eMandate Order Error:", error)
        res.status(500).json({ 
            success: false, message: error.message 
        })
    }
}

exports.subsequent = async (req, res) => {
   
    try {
        
        const { amount, currency, payment_capture, receipt, notification, notes, customer_id } = req.body

        if (!amount || !currency || !payment_capture || !receipt || !notification || !notification.payment_after) {
            return res.status(400).json({ 
                success: false, message: "All required fields must be provided"
            })
        }

        if (!notification.token_id && customer_id) {
            const token = await fetchTokenByCustomer(customer_id)
            if (token) {
                notification.token_id = token.id

            } else {
                return res.status(400).json({ 
                    success: false, message: "Token not found for customer" 
                })
            }
        }

        const order = await instance.orders.create({
            amount,
            currency,
            payment_capture,
            receipt,
            notification,
            notes
        })

        const savedOrder = await Emandate.create({
            amount,
            currency,
            payment_capture,
            receipt,
            notification,
            notes,
            razorpay_order_id: order.id,
            status: order.status
        })

        res.status(201).json({ 
            success: true, 
            message: "eMandate order created", 
            data: savedOrder 
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ 
            message: err.message 
        })
    }
}
