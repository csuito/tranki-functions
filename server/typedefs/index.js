const { gql } = require("apollo-server-express")

module.exports = gql`
  type Product {
    asin: ID!
    title: String!
    brand: String
    weight: String
    shipping_weight: String
    dimensions: String
    link: String
    description: String
    price: Price
    main_image: Media
    image: String
    images: [Media]
    categories: [Category]
    attributes: [Attribute]
    specifications: [Attribute]
    first_available: Availability
    frequently_bought_together: [Product]
  }

  type Price {
    symbol: String
    value: Float
    currency: String
    raw: String
  }

  type Category {
    name: String
  }

  type Attribute {
    name: String
    value: String
  }

  type Media {
    link: String
  }

  type Availability {
    raw: String
    utc: String
  }

  type Pagination {
    total_pages: Int!
    current_page: Int!
  }

  type Results {
    search_results: [Product]
    pagination: Pagination
  }

  type StockEstimation {
    asin: ID!
    stock_level: Int!
    price: Price
    is_prime: Boolean
    in_stock: Boolean!
    message: String
    min_quantity: Int
  }

  type Query {
    Product(asin: ID!): Product
    Search(search_term: String!) : Results
    Stock(asin: ID!): StockEstimation
  }
`