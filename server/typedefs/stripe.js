const { gql } = require("apollo-server-express")

module.exports = gql`
  type StripeCard {
    card_id: String!
    brand: String!
    country: String!
    customer: String!
    last4: String!
  }
`