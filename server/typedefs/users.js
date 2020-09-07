const { gql } = require("apollo-server-express")

module.exports = gql`
  type User {
    _id: ID
    firstName: String
    lastName: String
    firebaseID: ID
    email: String
    phoneNumber: String
    shippingAddresses: [Address]
    viewedProducts: [Product]
    lastLogin: String
    creationDate: String
  }
  input GetUserInput {
    firebaseID: ID!
  }
  input ProductInput {
    asin: ID!
    price: Float!
    qty: Int!
    variant: String
    link: String!
  }

  input TotalInput {
    cost: Float
    price: Float
  }

  input LocationInput {
    lat: String
    lon: String
  }

  input AddressInput {
    firebaseID: ID
    firstName: String!
    lastName: String!
    streetType: String!
    street: String!
    houseOrAptNumber: String!
    city: String!
    country: String!
    location: LocationInput
    residence: String
    urbanization: String
    municipality: String
    pointOfReference: String
  }

  input UpdateAddressInput {
    firebaseID: ID!
    addressID: ID!
    firstName: String
    lastName: String
    streetType: String
    street: String
    houseOrAptNumber: String
    city: String
    country: String!
    location: LocationInput
    residence: String
    urbanization: String
    municipality: String
    pointOfReference: String
  }

  input ShippingDataInput {
    address: AddressInput
    courier: String!
    method: String!
    volume: String!
    weight: String!
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
    firebaseID: ID!
    asin: String!
    title: String!
    image: String!
    price: String!
    link: String!
  }

  input ChangeUserStatusInput {
    firebaseID: ID!
    status: String!
  }
`