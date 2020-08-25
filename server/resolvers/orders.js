const { combineResolvers } = require("graphql-resolvers")
const { isOwner, isAdmin, isAuthenticated } = require("./middleware/auth")
const DBQuery = require("./helpers/dbSession")

module.exports = {
  orders: combineResolvers(
    isAdmin,
    async () => {
      const Order = require("../model/orders")
      try {
        const query = Order.find()
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  userOrders: combineResolvers(
    isAdmin,
    async (_, { userID }) => {
      const Order = require("../model/orders")
      try {
        const query = Order.find({ userID })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  order: combineResolvers(
    isAdmin,
    async (_, { _id }) => {
      const Order = require("../model/orders")
      try {
        const query = Order.findOne({ _id })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  createOrder: combineResolvers(
    isAuthenticated,
    async (_, { input }) => {
      const Order = require("../model/orders")
      try {
        const query = Order.create(input)
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),

  updateOrder: combineResolvers(
    isAdmin,
    async (_, { input }) => {
      const Order = require("../model/orders")
      try {
        const query = Order.findOneAndUpdate({ _id: input._id }, input, { new: true })
        return await DBQuery(query)
      } catch (e) {
        return e
      }
    }),
}