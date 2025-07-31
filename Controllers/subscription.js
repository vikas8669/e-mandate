const instance = require("../Config/Razorpay")
const User = require("../Models/User")
const Order = require("../Models/Order")
const Emandate = require("../Models/subsequent")
const Loan = require("../Models/instantLoan")
// const crypto = require("crypto")
require("dotenv").config()
const {sendExpoNotification } = require("../utils/sendPushNotification")

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

        res.status(201).json({
            success: true, newUser
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false, message: err.message
        })
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

            console.log("orderId here", registrationLink.order_id)
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
                receipt,
                order_id: registrationLink.order_id || null
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

exports.fetchPaymentByOrderId = async (req, res) => {
    try {
        const { order_id } = req.params;

        if (!order_id) {
            return res.status(400).json({ message: "Missing order_id" });
        }

        const payments = await instance.payments.all({ order_id });

        if (payments.count === 0 || payments.items.length === 0) {
            return res.status(404).json({ message: "No payment found for this order" });
        }

        const payment = payments.items[0]; 

        console.log("✅ Payment Fetched:", payment.id);

        const updatedOrder = await Order.findOneAndUpdate(
            { order_id }, 
            {
                razorpayPaymentId: payment.id,
                tokenId: payment.token_id || null,
                status: payment.status || "active"
            },
            { new: true } 
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found in DB" });
        }

        res.status(200).json({
            success: true,
            message: "Payment fetched and order updated successfully",
            payment_id: payment.id,
            token_id: payment.token_id || null,
            status: payment.status,
            updatedOrder
        });

    } catch (error) {
        console.error("Error fetching/storing payment:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.subsequent = async (req, res) => {

    try {

        let { userId, loanId, currency, customer_id, contact, email, token_id } = req.body

        if ( !currency || (!token_id && !customer_id)) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: amount, currency, and token_id or customer_id"
            })
        }

        const loan = await Loan.findById(loanId)
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: "Loan not found"
            })
        }
        // if (loanId) {
        //     if (loan) {
        //         const nextEmi = loan.emiDetails.find((emi) => emi.status === "pending");
        //         if (nextEmi) {
        //             nextEmi.status = "in-progress";
        //             nextEmi.razorpayPaymentId = payment.id;
        //             nextEmi.razorpayOrderId = order.id;
        //             await loan.save();
        //         }
        //     }
        // }


        const nextEmi = loan.emiDetails.find(emi => emi.status === "pending");
        if (!nextEmi) {
            return res.status(400).json({
                success: false,
                message: "No pending EMI found"
            });
        }

        const amount = nextEmi.totalAmount




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

        await Emandate.create({
            userId,
            loanId,
            amount,
            token_id: tokenToUse,
            customer_id,
            currency,
            payment_capture: true,
            razorpay_order_id: order.id, 
            razorpay_payment_id: payment.id,
            status: "in-progress",
            notification: {
                token_id: tokenToUse,
                payment_after: 30
            },
            notes: {
                customer_id,
                razorpay_payment_id: payment.id
            }
        })

        nextEmi.status = "in-progress";
        nextEmi.razorpayPaymentId = payment.id;
        nextEmi.razorpayOrderId = order.id;
        await loan.save()

        const user = await User.findById(userId);
        if (user && user.pushToken) {
            await sendExpoNotification(
                user._id,
                user.pushToken,
                "EMI Payment Initiated",
                `Your EMI of ₹${amount} has been initiated successfully. Payment ID: ${payment.id}`,
                {
                    type: "emi_initiated",
                    loanId: loan._id,
                    emiAmount: amount,
                    paymentId: payment.id
                }
            );
        }

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

// exports.razorpayWebhook = async (req, res) => {

//     try {

//         const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
//         const crypto = require("crypto")
//         const shasum = crypto.createHmac("sha256", webhookSecret)
//         shasum.update(JSON.stringify(req.body))
//         const digest = shasum.digest("hex")

//         const signature = req.headers["x-razorpay-signature"]
//         if (digest !== signature) {
//             return res.status(400).json({ message: "Invalid webhook signature" })
//         }

//         const event = req.body.event
//         const payload = req.body.payload

//         if (event === "token.created") {
//             const tokenData = payload.token.entity
//             console.log("Token Created:", tokenData)

//             await Token.create({
//                 tokenId: tokenData.id,
//                 customerId: tokenData.customer_id,
//                 method: tokenData.method,
//                 bank: tokenData.bank,
//                 status: tokenData.status,
//                 recurring: tokenData.recurring,
//                 createdAt: new Date(tokenData.created_at * 1000),
//                 expiredAt: new Date(tokenData.expire_at * 1000)
//             })

//             return res.status(200).json({ success: true, message: "Token saved" })
//         }

//         res.status(200).json({ success: true, message: "Webhook received" })
//     } catch (err) {
//         console.error("Webhook error:", err.message)
//         res.status(500).json({ message: err.message })
//     }
// }
