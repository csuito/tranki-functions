module.exports = `
  type Mutation {
    createUser(input: CreateUserInput!): User
    updateUser(input: UpdateUserInput!): User
    addUserAddress(input: AddressInput!): User
    updateUserAddress(input: UpdateAddressInput!): User
    removeUserAddress(input: RemoveUserAddressInput!): Boolean
    addUserProduct(input: AddUserProductInput!): Boolean
    changeUserStatus(input: ChangeUserStatusInput!): String
  }
`