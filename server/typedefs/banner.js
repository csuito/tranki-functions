const { gql } = require("apollo-server-express")

module.exports = gql`
  type Banner {
    text: String!
    image: String!
    type: String!
  }
`