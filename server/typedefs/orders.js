const { gql } = require("apollo-server-express")

module.exports = gql`
  type OrderProduct {
    asin: ID!
    price: Float
    qty: Int
    variant: String
    link: String
  }

  type Total {
    cost: Float
    price: Float
  }

  type Location {
    lat: String
    lon: String
  }

  interface BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    streetType: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    location: Location
    additionalInfo: String
  }

  type GenericAddress implements BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    streetType: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    location: Location
    additionalInfo: String
  }

  type VenezuelanAddress implements BaseAddress {
    _id: ID
    firstName: String
    lastName: String
    streetType: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String
    location: Location
    additionalInfo: String
    residence: String
    urbanization: String
    municipality: String
    pointOfReference: String
  }

  union Address = GenericAddress | VenezuelanAddress

  type ShippingData {
    address: Address
    courier: String
    total: Total
    method: String
    volume: String
    weight: String
    eta: String
  }

  type Order {
    _id: ID!
    cart: [OrderProduct]
    userID: String
    email: String
    phoneNumber: String
    amazonOrderID: String
    total: Total
    shipping: ShippingData
    status: String
    creationDate: String
  }

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
`