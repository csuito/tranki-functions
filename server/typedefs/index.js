const { gql } = require("apollo-server-express")

module.exports = gql`
  type Product {
    asin: ID
    title: String
    brand: String
    weight: String
    dimensions: String
    link: String
    description: String
  }

  type Query {
    Product(asin: ID!): Product
    Products(search_term: String!) : [Product]
  }
`