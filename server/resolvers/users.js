const { combineResolvers } = require("graphql-resolvers")
const { isOwner, isAdmin } = require("./middleware/auth")
const DBQuery = require("./helpers/dbSession")

module.exports = {
  createUser: async (_, { input }) => {
    const User = require("../model/users")
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
      const User = require("../model/users")
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
    isOwner,
    async (_, { input }) => {
      const User = require("../model/users")
      try {
        const query = User.findOneAndUpdate(
          { firebaseID: input.firebaseID },
          { $push: { shippingAddresses: input } },
          { new: true })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  updateUserAddress: combineResolvers(
    isOwner,
    async (_, { input }) => {
      const User = require("../model/users")
      try {
        const query = User.findOneAndUpdate(
          { firebaseID: input.firebaseID, 'shippingAddresses._id': input.addressID },
          { $set: { 'shippingAddresses.$': input } },
          { new: true })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  addUserProduct: combineResolvers(
    isOwner,
    async (_, { input }) => {
      const User = require("../model/users")

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
      const User = require("../model/users")

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
      const User = require("../model/users")

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
      const User = require("../model/users")
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
      const User = require("../model/users")
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