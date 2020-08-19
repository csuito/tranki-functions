const { gql } = require("apollo-server-express")

module.exports = gql`
  type Department {
    name: String!
    active: Boolean!
    image: String
  }
`