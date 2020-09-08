const { gql } = require("apollo-server-express")

module.exports = gql`
input SupplierInput {
    name: String!
    supplierOrderID: String
  }

  input ProductInput {
    asin: ID!
    price: Float!
    qty: Int!
    link: String!
    variant: String
    supplier: SupplierInput
  }

  input AddressInput {
    firstName: String!
    lastName: String!
    streetType: String!
    street: String!
    houseOrAptNumber: String!
    city: String!
    state: String!
    country: String!
    postCode: String
    residence: String
    urbanization: String
    municipality: String
    additionalInfo: String
  }

  input TotalInput {
    cost: Float
    price: Float
  }

  input PaymentInput {
    txID: String!
    method: String!
  }

  input ShippingDataInput {
    address: AddressInput
    courier: String!
    method: String!
    weight: String
    dimensions: String
    total: TotalInput
    eta: String
  }

  input CreateOrderInput {
    cart: [ProductInput]!
    userID: String!
    firstName: String!
    lastName: String!
    email: String!
    phoneNumber: String!
    total: TotalInput!
    payment: PaymentInput!
    shipping: ShippingDataInput!
    status: String
  }

  input UpdateOrderInput {
    _id: ID!
    cart: [ProductInput]
    userID: String
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    total: TotalInput
    shipping: ShippingDataInput
    status: String
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrder(input: UpdateOrderInput!): Order
  }
`