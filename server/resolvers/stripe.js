const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const DBQuery = require("./helpers/dbSession")


module.exports = {
  /**
   * Onboard new stripe user
   */
  onBoardStripeUser: combineResolvers(
    isAuthenticated,
    async ({ input = {} }) => {
      const { card_token, email, firebaseID } = input
      const User = require('../model/users')
      const stripe = require('stripe')(process.env.STRIPE_KEY)
      const user = await DBQuery(User.findOne({ firebaseID }))
      let stripeCustomer
      if (user && (!user.stripe || !user.stripe.id)) {
        try {
          const { id } = await stripe.customers.create({
            metadata: { email, firebaseID }
          })
          stripeCustomer = { id, cards: [] }
        } catch (e) {
          return new Error('Unable to create stripe customer')
        }
      } else {
        stripeCustomer = user.stripe
        const card = stripeCustomer.cards.find(c => c.token === card_token)
        if (card) {
          return new Error('Card already attached to user')
        }
      }
      try {
        const { id, brand, cvc_check, last4 } = await stripe.customers.createSource(
          stripeCustomer.id,
          { source: card_token }
        )
        if (id && cvc_check) {
          stripeCustomer.cards.push({ id, type: brand, last4, token: card_token })
        }
        await DBQuery(User.updateOne({ firebaseID }, { $set: { 'stripe': stripeCustomer } }))
      } catch (e) {
        return new Error('Unable to save new card')
      }
    })
}