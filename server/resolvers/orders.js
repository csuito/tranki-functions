const { combineResolvers } = require("graphql-resolvers")
const { isOwnerOrAdmin, isAdmin, isAuthenticated, isOwner } = require("./middleware/auth")
const dayjs = require('dayjs')
const DBQuery = require("./helpers/dbSession")


module.exports = {
  orders: combineResolvers(
    isAdmin,
    async (_, { status = "unfulfilled", courier = false, month = false, year = false }) => {
      let query = {}
      if (status) query.status = status
      if (courier) {
        query.shipping = { courier }
      }
      if (month && year) {
        const from = dayjs().set('month', month).set('year', year).startOf('month').toDate()
        const to = dayjs().set('month', month).set('year', year).endOf('month').toDate()
        query.creationDate = { '$lte': to, '$gte': from }
      }
      const Order = require("../model/orders")
      try {
        const opQuery = Order.find(query).lean()
        const response = await DBQuery(opQuery)
        return response
      } catch (e) {
        return e
      }
    }),

  userOrders: combineResolvers(
    isOwnerOrAdmin,
    async (_, { userID }) => {
      const Order = require("../model/orders")
      try {
        const query = Order.find({ userID }).lean()
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
    isOwner,
    async (_, { input }) => {
      const Order = require("../model/orders")
      const { sendOrderConfirmation } = require('./services/sendgrid')
      const { orderRecieved } = require('../../functions/bots/slack')
      try {
        const { payment: { card, customer, last4, brand, fee }, userID, email, price, idemKey, cart, shipping: { total: shippingCost } } = input
        // Stripe payment
        let options = {}
        if (idemKey) {
          options.idempotencyKey = idemKey
        }
        const stripe = require('stripe')(process.env.STRIPE_KEY)
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
          let formattedPrice = parseFloat(price.toFixed(2))
          input = { ...input, price: formattedPrice, payment: { txID: charge.id, method: 'Stripe', last4, brand, fee } }

          // Saving order to DB
          const query = Order.create(input)

          // Sending order completed email
          const order = await DBQuery(query)
          const { locator } = order
          const subTotal = price - (fee + shippingCost.price)
          await orderRecieved({ email, total: formattedPrice, date: new Date().toDateString(), locator })
          await sendOrderConfirmation({ email, locator, cart, subTotal, shippingCost: shippingCost.price, total: price, stripeFee: fee })
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
      const Order = require('../model/orders')
      const User = require('../model/users')
      const dayjs = require('dayjs')
      const { orderID } = input
      let hourDiff, order

      // Looking for order and checking hour difference
      try {
        const query = Order.findOne({ _id: orderID })
        order = await DBQuery(query)
        const creationDate = dayjs(order.creationDate)
        const today = dayjs()
        hourDiff = today.diff(creationDate, "hour")
      } catch (e) {
        return false
      }

      // Issuing automatic refund
      if (hourDiff <= 2) {
        try {
          const { orderCancelled } = require('./services/sendgrid')
          const query = Order.findOneAndUpdate({ _id: orderID }, { $set: { status: "cancelled" } })
          await DBQuery(query)
          const stripe = require('stripe')(process.env.STRIPE_KEY)
          const { price, payment: { txID: charge, fee } } = order
          // The amount to be refunded is the price minus our processing fee
          const amount = parseInt(((price - fee) * 100).toFixed(0), 10)
          const refund = await stripe.refunds.create({ charge, amount })
          if (refund.status === "succeeded") {
            // Let the user know through email
          }
          const user = await DBQuery(User.findOne({ firebaseID: order.userID }))
          const { firstName, email } = user
          const { locator } = order
          await orderCancelled({ firstName, email, total: price, orderID: locator })
          return true
        } catch (e) {
          return false
        }
      }

      return false
    }),

  updateOrderProductStatus: combineResolvers(
    isAdmin,
    async (_, { input }) => {
      const { productID, orderID, status } = input
      const Order = require('../model/orders')
      const order = await DBQuery(Order.findOne({ _id: orderID }).lean())
      if (!order) { throw new Order("No order found with specified ID") }
      const productIndex = order.cart.findIndex(p => p.productID === productID)
      if (productIndex === -1) { throw new Error("Product not found in order's cart") }
      order.cart[productIndex].status = status
      await order.save()
      return status
    }
  )
}