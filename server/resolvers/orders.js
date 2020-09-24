const { combineResolvers } = require("graphql-resolvers")
const { isOwnerOrAdmin, isAdmin, isAuthenticated } = require("./middleware/auth")
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
    isOwnerOrAdmin,
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
        const { payment: { card, customer }, userID, total: { price } } = input
        const stripe = require('stripe')('sk_test_51HPRJCK9woMnl4elTKweX8ESZ67UsoXWklbWE17X9t6iT2GbE2Aj47auuBKa6R2MDu0P5m9Aeefj2Iz9tiz3t7mF009ApZZ1A3')
        const charge = await stripe.charges.create({
          amount: parseInt((price * 100).toFixed(0), 10),
          currency: 'usd',
          source: card,
          customer,
          description: userID
        })
        if (charge && charge.id) {
          input = { ...input, payment: { txID: charge.id, method: 'Stripe' } }
          const query = Order.create(input)
          return await DBQuery(query)
        }
        return new Error('Unable to process payment')
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