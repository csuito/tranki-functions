const { gql } = require("apollo-server-express")

module.exports = gql`
  type Supplier {
    name: String
    supplierOrderID: String
  }

  type OrderProduct {
    asin: ID!
    price: Float
    qty: Int
    variant: String
    link: String
    supplier: Supplier
  }

  type Total {
    cost: Float
    price: Float
  }

  type PaymentData {
    txID: String
    method: String
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
    state: String
    postCode: String
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
    state: String
    postCode: String
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
    state: String
    postCode: String
    additionalInfo: String
    residence: String
    urbanization: String
    municipality: String
  }

  union Address = GenericAddress | VenezuelanAddress

  type Timeline {
    status: String
    date: String
  }

  type ShippingData {
    address: Address
    courier: String
    total: Total
    method: String
    dimensions: String
    weight: String
    timeline: Timeline
    eta: String
  }

  type Order {
    _id: ID!
    cart: [OrderProduct]
    userID: String
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    total: Total
    payment: PaymentData
    shipping: ShippingData
    status: String
    creationDate: String
    updatedOn: String
  }

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
`