const { gql } = require("apollo-server-express")

module.exports = gql`
  type Pagination {
    total_pages: Int!
    current_page: Int!
  }

  type Results {
    search_results: [Product]
    pagination: Pagination
  }
`