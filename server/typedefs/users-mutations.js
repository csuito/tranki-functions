const { gql } = require("apollo-server-express")

module.exports = gql`
  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(input: UpdateUserInput!): User
    addUserAddress(input: AddressInput!): User
    updateUserAddress(input: UpdateAddressInput!): User
    addUserProduct(input: AddUserProductInput!): Boolean
    changeUserStatus(input: ChangeUserStatusInput!): String
  }
`