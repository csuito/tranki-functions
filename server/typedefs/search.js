const { gql } = require("apollo-server-express")

module.exports = gql`
  type Pagination {
    total_pages: Int!
    current_page: Int!
    start: Int
    end: Int
    reviews_total: Int
  }

  extend type Product {
    prices: [Price]
  }

  extend type Price {
    name: String
  }

  type Results {
    search_results: [Product]
    pagination: Pagination
  }
`