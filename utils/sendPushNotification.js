const Notification = require("../Models/Notification")
const {Expo} = require("expo-server-sdk")
const expo = new Expo()

const sendExpoNotification = async(pushToken, title, body, data ) => {

    try {

        if(!Expo.isExpoPushToken(pushToken)) {
            throw new Error("invalid token")
        }

        const message = {
            to:pushToken,
            sound:"Default",
            title,
            body,
            data
        }

        const receipt = await expo.sendPushNotificationsAsync([message])

        await Notification.create({
            userId,
            pushToken,
            title,
            body,
            data,
            status:"sent"
        })
        
        return receipt

    } catch(err) {
        console.log(err)
    }
}

module.exports = sendExpoNotification



