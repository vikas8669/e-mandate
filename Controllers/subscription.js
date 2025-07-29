const instance = require("../Config/Razorpay")
const User = require("../Models/User")
const Order = require("../Models/Order")
const Emandate = require("../Models/subsequent")

const Token = require("../Models/Token")
const crypto = require("crypto")
require("dotenv").config()


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
                expireAt: new Date(expire_at * 1000),
                notes: {
                    plan: "EMI Plan",
                    duration: "12 months"
                },
                upiRegistrationLink: registrationLink.short_url || registrationLink.url,
                receipt
            })

            await newOrder.save()

            return res.status(200).json({
                success: true, registrationLink

            })
        }

        if (!authType || !["netbanking", "debitcard"].includes(authType)) {
            return res.status(400).json({
                message: "Invalid authType"
            })
        }

        if (!beneficiary_name || !account_number || !ifsc_code) {
            return res.status(400).json({ message: "Missing bank details for mandate" })
        }

        const order = await instance.orders.create({
            amount: 100,
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

        // const fetchTokenByCustomer = async (customer_id) => {

        //     try {
        //         const tokens = await instance.customers.fetchTokens(customer_id)
        //         return tokens.items.length ? tokens.items[0] : null
        //     } catch (err) {
        //         console.error("Token fetch error:", err.message)
        //         return null
        //     }
        // }

        // const token = await fetchTokenByCustomer(customer_id)
        // console.log("Token here: ", token)
        // if (!token) {
        //     return res.status(400).json({ success: false, message: "Token not yet available" })
        // }

        const newOrder = new Order({
            razorpayCustomerId: customer_id,
            method,
            payment_capture: true,

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

        res.status(200).json({ success: true, order })
    } catch (error) {
        console.error("eMandate Order Error:", error)
        res.status(500).json({
            success: false, message: error.message
        })
    }
}

exports.fetchToken = async (req, res) => {

    try {
        const { customer_id } = req.params

        if (!customer_id) {
            return res.status(400).json({ success: false, message: "Customer ID is required" })
        }

        const tokens = await instance.customers.fetchTokens(customer_id)

        if (!tokens.items || tokens.items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No token found yet for this customer"
            })
        }

        const token = tokens.items[0]
        console.log("Token fetched:", token.id)

        const updatedOrder = await Order.findOneAndUpdate(
            {
                razorpayCustomerId: customer_id,
                tokenId: null
            },
            {
                tokenId: token.id,
                status: "active"
            },
            {
                new: true
            }
        )

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "No matching order found to update"
            })
        }

        res.status(200).json({
            success: true,
            message: "Token fetched and order updated",
            tokenId: token.id,
            order: updatedOrder
        })

    } catch (error) {
        console.error("Fetch Token Error:", error.message)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.subsequent = async (req, res) => {

    try {

        let { amount, currency, customer_id, contact, email, token_id } = req.body

        if (!amount || !currency || (!token_id && !customer_id)) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, currency, and token_id or customer_id"
            })
        }

        let tokenToUse = token_id
        console.log(tokenToUse)
        if (!tokenToUse && customer_id) {
            const token = await fetchTokenByCustomer(customer_id)
            if (token && token.status === "active") {
                tokenToUse = token.id
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Token not found or not active"
                })
            }
        }

        const order = await instance.orders.create({
            amount: amount * 100,
            currency,
            payment_capture: true,
        })

        console.log("Created Razorpay order:", order.id)

        const payment = await instance.payments.createRecurringPayment({
            email,
            contact,
            amount: amount * 100,
            currency,
            customer_id,
            token: tokenToUse,
            recurring: "1",
            order_id: order.id,
            description: "Auto-debit EMI"
        })

        const saved = await Emandate.create({
            amount,
            currency,
            customer_id,
            token_id: tokenToUse,
            razorpay_payment_id: payment.id,
            order_id: order.id,
            status: "initiated"
        })

        return res.status(201).json({
            success: true,
            message: "Recurring payment initiated",
            payment
        })

    } catch (err) {
        console.error("Razorpay error full:", err)

        return res.status(500).json({
            success: false,
            message: err?.response?.data?.error?.description || err.message,
            details: err?.response?.data || null
        })
    }
}


exports.razorpayWebhook = async (req, res) => {

    try {

        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
        const crypto = require("crypto")
        const shasum = crypto.createHmac("sha256", webhookSecret)
        shasum.update(JSON.stringify(req.body))
        const digest = shasum.digest("hex")

        const signature = req.headers["x-razorpay-signature"]
        if (digest !== signature) {
            return res.status(400).json({ message: "Invalid webhook signature" })
        }

        const event = req.body.event
        const payload = req.body.payload

        if (event === "token.created") {
            const tokenData = payload.token.entity
            console.log("Token Created:", tokenData)

            await Token.create({
                tokenId: tokenData.id,
                customerId: tokenData.customer_id,
                method: tokenData.method,
                bank: tokenData.bank,
                status: tokenData.status,
                recurring: tokenData.recurring,
                createdAt: new Date(tokenData.created_at * 1000),
                expiredAt: new Date(tokenData.expire_at * 1000)
            })

            return res.status(200).json({ success: true, message: "Token saved" })
        }

        res.status(200).json({ success: true, message: "Webhook received" })
    } catch (err) {
        console.error("Webhook error:", err.message)
        res.status(500).json({ message: err.message })
    }
}

