const { combineResolvers } = require("graphql-resolvers")
const { isOwner, isAdmin, isAuthenticated } = require("./middleware/auth")
const DBQuery = require("./helpers/dbSession")
const User = require("../model/users")

module.exports = {
  userExists: async (_, { email, firebaseID, phoneNumber }, ctx) => {
    try {
      let queryParams = {}
      if (email) queryParams.email = email
      if (firebaseID) queryParams.firebaseID = firebaseID
      if (phoneNumber) queryParams.phoneNumber = phoneNumber
      const query = User.findOne(queryParams)
      const user = await DBQuery(query)
      if (user) {
        return true
      } else {
        return false
      }
    } catch (e) {
      throw new Error(e)
    }
  },

  createUser: async (_, { input }) => {
    try {
      const query = User.create(input)
      return await DBQuery(query)
    } catch (e) {
      return e
    }
  },

  updateUser: combineResolvers(
    isOwner,
    async (_, { input }, ctx) => {
      const { firebaseID, firstName, lastName, phoneNumber } = input
      try {
        const query = User.findOneAndUpdate(
          { firebaseID },
          { $set: { firstName, lastName, phoneNumber } },
          { new: true })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  addUserAddress: combineResolvers(
    isAuthenticated,
    async (_, { input }, { auth }) => {
      const app = require("../../functions/config/firebase")
      const { user_id: firebaseID } = await app.auth().verifyIdToken(auth)

      try {
        const query = User.findOneAndUpdate(
          { firebaseID },
          { $addToSet: { shippingAddresses: input } },
          { new: true })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  updateUserAddress: combineResolvers(
    isAuthenticated,
    async (_, { input }, { auth }) => {
      const app = require("../../functions/config/firebase")
      const { user_id: firebaseID } = await app.auth().verifyIdToken(auth)

      try {
        const query = User.findOneAndUpdate(
          { firebaseID, 'shippingAddresses._id': input.addressID },
          { $set: { 'shippingAddresses.$': input } },
          { new: true }
        )
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  removeUserAddress: combineResolvers(
    isAuthenticated,
    async (_, { input }, { auth }) => {
      const app = require("../../functions/config/firebase")
      const { user_id: firebaseID } = await app.auth().verifyIdToken(auth)

      try {
        const getUser = User.findOne({ firebaseID })
        const user = await DBQuery(getUser)
        user.shippingAddresses.id(input.addressID).remove()
        await DBQuery(user.save())
        return true
      } catch (e) {
        return e
      }
    }),

  addUserProduct: combineResolvers(
    isOwner,
    async (_, { input }) => {
      try {
        const query = User.findOneAndUpdate(
          { firebaseID: input.firebaseID },
          { $push: { viewedProducts: input } },
          { new: true })
        await DBQuery(query)
        return true
      } catch (e) {
        return false
      }
    }),

  user: combineResolvers(
    isOwner,
    async (_, { input: { firebaseID } }) => {
      try {
        const query = User.findOne({ firebaseID }).lean()
        const user = await DBQuery(query)
        user.stripeCustomer = user && user.stripe && user.stripe.id ? user.stripe.id : null
        if (user.stripeCustomer) {
          const stripe = require('stripe')('sk_test_51HPRJCK9woMnl4elTKweX8ESZ67UsoXWklbWE17X9t6iT2GbE2Aj47auuBKa6R2MDu0P5m9Aeefj2Iz9tiz3t7mF009ApZZ1A3')
          const cards = await stripe.customers.listSources(user.stripeCustomer, { object: 'card' })
          user.cards = cards.data.map(card => ({ card_id: card.id, brand: card.brand, country: card.country, last4: card.last4, customer: user.stripeCustomer }))
        }
        return user
      } catch (e) {
        return e
      }
    }),

  users: combineResolvers(
    isAdmin,
    async () => {
      try {
        const query = User.find()
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  activeUsers: combineResolvers(
    isAdmin,
    async () => {
      try {
        const query = User.find({ status: "active" })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  changeUserStatus: combineResolvers(
    isOwner,
    async (_, { input: { firebaseID, status } }) => {
      try {
        const query = User.findOneAndUpdate(
          { firebaseID },
          { $set: { status } })
        await DBQuery(query)
        return status
      } catch (e) {
        return e
      }
    }),

  addExpoToken: combineResolvers(
    isOwner,
    async (_, { input: { firebaseID, token, installationID } }) => {
      const query = User.findOne({ firebaseID })
      const user = await DBQuery(query)
      try {
        if (user.expoTokens && user.expoTokens.length > 0) {
          const existingDevice = user.expoTokens.find(t => t.installationID === installationID)
          if (existingDevice) {
            const index = user.expoTokens.findIndex(t => t.installationID === installationID)
            existingDevice.token = token
            user.expoTokens[index] = existingDevice
            await DBQuery(User.updateOne({ firebaseID }, user))
            return true
          }
        }
        user.expoTokens = user.expoTokens || []
        user.expoTokens.push({ token, installationID })
        await DBQuery(User.updateOne({ firebaseID }, user))
        console.log("Done!")
        return true
      } catch (e) {
        return false
      }
    }
  )
}