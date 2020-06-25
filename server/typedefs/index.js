const { gql } = require("apollo-server-express")

module.exports = gql`
  type Product {
    asin: ID!
    title: String!
    brand: String
    weight: String
    dimensions: String
    link: String
    description: String
    price: Price
    main_image: Media
    image: String
    images: [Media]
    categories: [Category]
    attributes: [Attribute]
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

  type Pagination {
    total_pages: Int!
    current_page: Int!
  }

  type Results {
    search_results: [Product]
    pagination: Pagination
  }

  type Query {
    Product(asin: ID!): Product
    Search(search_term: String!) : Results
  }
`