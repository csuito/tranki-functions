const { gql } = require("apollo-server-express")

module.exports = gql`

  input StripeOnBoardInput {
    card_token: String!
    email: String!
    firebaseID: String!
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
    amount: Float!
    card: String!
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
    
  input GetShippingCostsInput {
    asin: String!
    quantity: Int!
  }
  input GetUserInput {
    firebaseID: ID!
  }

  input UpdateAddressInput {
    addressID: ID!
    firstName: String
    lastName: String
    streetType: String
    street: String
    houseOrAptNumber: String
    city: String
    state: String
    country: String
    postCode: String
    residence: String
    urbanization: String
    municipality: String
    additionalInfo: String
  }

  input CreateUserInput {
    firebaseID: ID!
    firstName: String!
    lastName: String!
    email: String!
    phoneNumber: String!
  }

  input UpdateUserInput {
    firebaseID: ID!
    firstName: String!
    lastName: String!
    phoneNumber: String!
  }

  input AddUserProductInput {
    asin: ID!
    price: Float!
    qty: Int!
    link: String!
    supplier: SupplierInput
  }

  input ChangeUserStatusInput {
    firebaseID: ID!
    status: String!
  }
`