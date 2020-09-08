const { gql } = require("apollo-server-express")

module.exports = gql`
  input ProductInput {
    asin: ID!
    price: Float!
    qty: Int!
    link: String!
    variant: String
    supplier: SupplierInput
  }

  input SupplierInput {
    name: String!
    supplierOrderID: String
  }

  input TotalInput {
    cost: Float
    price: Float
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

  input ShippingDataInput {
    address: AddressInput
    courier: String!
    method: String!
    weight: String
    dimensions: String
    total: TotalInput
    eta: String
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

  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(input: UpdateUserInput!): User
    addUserAddress(input: AddressInput!): User
    updateUserAddress(input: UpdateAddressInput!): User
    addUserProduct(input: AddUserProductInput!): Boolean
    changeUserStatus(input: ChangeUserStatusInput!): String
  }
`