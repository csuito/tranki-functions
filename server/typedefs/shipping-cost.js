const { gql } = require("apollo-server-express")

module.exports = gql`
  type ShippingCost {
    air: Float!
    sea: Float!
    in_stock: [String!]!
    price_changed: Boolean!
    airCost: Float!
    seaCost: Float!
    dimensions: Float!
    weight: Float!
    volumetric_weight: Float!
  }
`