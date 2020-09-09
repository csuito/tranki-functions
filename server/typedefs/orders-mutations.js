const { gql } = require("apollo-server-express")

module.exports = gql`
  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrder(input: UpdateOrderInput!): Order
  }
`