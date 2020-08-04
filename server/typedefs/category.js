const { gql } = require("apollo-server-express")

module.exports = gql`
  type CategoryProduct {
    name: String!
    products: [Product]
  }
`