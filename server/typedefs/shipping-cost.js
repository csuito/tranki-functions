const { gql } = require("apollo-server-express")

module.exports = gql`
  type ShippingCost {
    air: Float!
    sea: Float!
    in_stock: [String!]!
  }
`