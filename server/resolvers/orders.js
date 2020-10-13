const { combineResolvers } = require("graphql-resolvers")
const { isOwnerOrAdmin, isAdmin, isAuthenticated, isOwner } = require("./middleware/auth")
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
      const { sendOrderConfirmation } = require('./services/sendgrid')
      try {
        const { payment: { card, customer, last4, brand }, userID, email, price, idemKey, cart, shipping: { total: shippingCost } } = input

        // Stripe payment
        let options = {}
        if (idemKey) {
          options.idempotencyKey = idemKey
        }
        const stripe = require('stripe')('sk_test_51HPRJCK9woMnl4elTKweX8ESZ67UsoXWklbWE17X9t6iT2GbE2Aj47auuBKa6R2MDu0P5m9Aeefj2Iz9tiz3t7mF009ApZZ1A3')
        const charge = await stripe.charges.create({
          amount: parseInt((price * 100).toFixed(0), 10),
          currency: 'usd',
          source: card,
          customer,
          description: userID
        }, options)
        // If payment was successful we proceed with order creation and email notifications
        if (charge && charge.id) {
          // Adding stripe info to order payload
          input = { ...input, payment: { txID: charge.id, method: 'Stripe', last4, brand } }

          // Saving order to DB
          const query = Order.create(input)

          // Sending order completed email
          const order = await DBQuery(query)
          const { locator } = order
          const stripeFee = (((price) * 2.9) / 100) + 0.3
          const subTotal = price - (stripeFee + shippingCost)
          await sendOrderConfirmation({ email, locator, cart, subTotal, shippingCost, total: price, stripeFee })
          return order
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

  cancelOrder: combineResolvers(
    isOwner,
    async (_, { input }) => {
      const Order = require("../model/orders")
      const { orderID } = input
      try {
        const query = Order.findOneAndUpdate({ _id: orderID }, { $set: { status: "cancelled" } })
        await DBQuery(query)
        return true
      } catch (e) {
        return false
      }
    })
}