module.exports = `
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
    expoTokens: [PushDevice!]
    stripeCustomer: String
    cards: [StripeCard]
  }

  type PushDevice {
    token: String!
    installationID: String!
  }
`