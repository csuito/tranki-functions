const { gql } = require("apollo-server-express")

const productSchema = require("./product")
const searchSchema = require("./search")
const stockSchema = require("./stock")

const queries = gql`
  type Query {
    Product(asin: ID!): Product
    Search(search_term: String!) : Results
    Stock(asin: ID!): StockEstimation
  }
`

module.exports = [productSchema, searchSchema, stockSchema, queries]