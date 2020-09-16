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
          { $push: { shippingAddresses: input } },
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
          { new: true })
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
        const query = User.findOne({ firebaseID })
        const user = await DBQuery(query)

        const addresses = user.shippingAddresses.filter(address => address._id !== input.addressID)
        user.shippingAddresses = addresses

        const save = user.save()
        await DBQuery(save)
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
        const query = User.findOne({ firebaseID })
        return await DBQuery(query)
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
    })
}