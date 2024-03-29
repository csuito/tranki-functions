module.exports = `
  type Pagination {
    total_pages: Int!
    current_page: Int!
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