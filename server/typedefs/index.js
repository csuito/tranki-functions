const { gql } = require("apollo-server-express")

const productSchema = require("./product")
const categorySchema = require("./category")
const searchSchema = require("./search")
const stockSchema = require("./stock")
const reviewSchema = require("./reviews")
const bestsellerSchema = require("./bestsellers")

const queries = gql`
  type Query {
    product(asin: ID!): Product
    products(department: String!, category: String): [Product]
    categories(department: String!): [CategoryProduct]!
    search(search_term: String!, sort_by: String, page: Int): Results
    stock(asin: ID!) : StockEstimation
    reviews(asin: ID!, sort_by: String, reviewer_type: String, review_stars: String, page: Int): ReviewsResult
    bestsellers(url: String!, page: Int): Bestsellers
  }
`

module.exports = [productSchema, categorySchema, searchSchema, stockSchema, reviewSchema, bestsellerSchema, queries]