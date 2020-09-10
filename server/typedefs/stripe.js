const { gql } = require("apollo-server-express")

module.exports = gql`
  type StripeCard {
    card_id: String!
  }
`