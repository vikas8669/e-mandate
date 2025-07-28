const instance = require("../Config/Razorpay")
const User = require("../Models/User")
const Order = require("../Models/Order")
const Emandate = require("../Models/subsequent")





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
