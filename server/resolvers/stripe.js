const { combineResolvers } = require("graphql-resolvers")
const { isOwner } = require("./middleware/auth")
const DBQuery = require("./helpers/dbSession")

module.exports = {
  /**
   * Onboard new stripe user
   */
  onBoardStripeUser: combineResolvers(
    // isAuthenticated,
    async (_, { input = {} }) => {
      const { card_token, email, firebaseID, last4, country } = input
      const User = require('../model/users')
      const stripe = require('stripe')(process.env.STRIPE_KEY)

      const user = await DBQuery(User.findOne({ firebaseID }))

      let stripeCustomer
      if (user && (!user.stripe || !user.stripe.id)) {
        try {
          const { id } = await stripe.customers.create({ metadata: { email, firebaseID }, email: email, description: firebaseID })
          stripeCustomer = { id, cards: [] }
        } catch (e) {
          return new Error('Unable to create stripe customer')
        }
      } else {
        stripeCustomer = user.stripe
        const card = stripeCustomer.cards.find(c => c.token === card_token || c.last4 === last4)
        if (card) {
          return { card_id: card.id, brand: card.brand, last4: card.last4, customer: stripeCustomer.id, token: card.token, country }
        }
      }

      try {
        const { id, brand, last4, country } = await stripe.customers.createSource(stripeCustomer.id, {
          source: card_token
        })
        if (id) {
          stripeCustomer.cards.push({ id, brand, last4, token: card_token })
        }
        await DBQuery(User.updateOne({ firebaseID }, { $set: { 'stripe': stripeCustomer } }))
        return { card_id: id, brand, last4, customer: stripeCustomer.id, country }
      } catch (e) {
        return new Error(e)
      }
    }),

  listCustomerCards: combineResolvers(
    isOwner,
    async (_, { input = {} }) => {
      const { customer } = input
      const stripe = require('stripe')(process.env.STRIPE_KEY)
      let cards = await stripe.customers.listSources(
        customer,
        { object: 'card' }
      )
      return cards.data.map(c => ({ card_id: c.id, brand: c.brand, country: c.country, last4: c.last4, customer }))
    }
  ),
  removeCustomerCard: combineResolvers(
    isOwner,
    async (_, { input = {} }) => {
      const stripe = require('stripe')(process.env.STRIPE_KEY)
      const { customer, firebaseID, card_id } = input
      const User = require('../model/users')
      try {
        const op = await stripe.customers.deleteSource(
          customer,
          card_id
        )
        const user = await DBQuery(User.findOne({ firebaseID }))
        const cards = user.stripe.cards.filter(c => c.id !== card_id)
        user.stripe.cards = cards
        await DBQuery(user.save())
        return op.deleted
      } catch (e) {
        return new Error(e)
      }
    }
  )
}