const express = require('express')
const DBQuery = require('../server/resolvers/helpers/dbSession')
const app = express()
const { isAuthenticatedRest, isOwnerRest } = require('../server/resolvers/middleware/auth')


app.post('/', /*Auth required */ async (req, res) => {
  const { firebaseID, title, message: body } = req.body
  const User = require('../server/model/users')
  const { Expo } = require('expo-server-sdk')
  let expo = new Expo()
  const user = await DBQuery(User.findOne({ firebaseID }))
  let messages = []
  if (user.expoTokens && user.expoTokens.length > 0) {
    const tokens = user.expoTokens.map(t => t.token)
    for (let token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`)
        continue
      }
      messages.push({
        to: token,
        sound: 'default',
        title,
        body
      })
    }
    let chunks = expo.chunkPushNotifications(messages)
    // let tickets = []
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk)
        // tickets.push(...ticketChunk)
      } catch (error) {
        console.error(error)
      }
    }
    return res.status(200).json({ success: true })
  }
  return res.status(204).json({ success: true, message: "No push tokens found" })
})

app.post('/all', /*Auth required */ async (req, res) => {
  const { title, message: body } = req.body
  const User = require('../server/model/users')
  const { Expo } = require('expo-server-sdk')
  let expo = new Expo()
  const users = await DBQuery(User.find())
  let messages = []
  for (let user of users) {
    if (user.expoTokens && user.expoTokens.length > 0) {
      const tokens = user.expoTokens.map(t => t.token)
      for (let token of tokens) {
        if (!Expo.isExpoPushToken(token)) {
          console.error(`Push token ${pushToken} is not a valid Expo push token`)
          continue
        }
        messages.push({
          to: token,
          sound: 'default',
          title,
          body
        })
      }
    }
  }
  let chunks = expo.chunkPushNotifications(messages)
  // let tickets = []
  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
      // tickets.push(...ticketChunk)
    } catch (error) {
      console.error(error)
    }
  }
  return res.status(200).json({ success: true })
})

module.exports = app