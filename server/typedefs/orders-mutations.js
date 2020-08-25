const { gql } = require("apollo-server-express")

module.exports = gql`

  input CreateOrderInput {
    cart: [ProductInput]!
    userID: String!
    email: String!
    phoneNumber: String!
    shipping: ShippingDataInput!
    amazonOrderID: String
    total: TotalInput
    status: String
  }

  input UpdateOrderInput {
    _id: ID!
    cart: [ProductInput]
    userID: String
    email: String
    phoneNumber: String
    amazonOrderID: String
    total: TotalInput
    shipping: ShippingDataInput
    status: String
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrder(input: UpdateOrderInput!): Order
  }
`