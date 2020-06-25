// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql SEARCH queries", () => {
  const searchQuery = gql`
    query search($search_term: String!) {
      Search(search_term: $search_term) {
        search_results {
         asin
         title
         brand
        }
        pagination {
          current_page
          total_pages
        }
      }
    }
  `

  const testProduct = {
    asin: "B06XWZWYVP",
    title: "Samsung (MB-ME128GA/AM) 128GB",
    brand: "Samsung"
  }

  const testVariables = {
    search_term: "Samsung MicroSD card"
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid search query", () => {
    const invalidQuery = gql`
    query search($search_term: String!) {
      Results(search_term: $search_term) {
         search_results {
           asin
           title
           invalid_field
         }
         pagination {
           current_page
           total_pages
         }
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid search query", () => {
    tester.test(true, { query: searchQuery, variables: testVariables })
  })

  it("should return mocked fields on search query", () => {
    const fixture = {
      data: {
        Search: {
          search_results: [testProduct],
          pagination: {
            total_pages: 20,
            current_page: 1
          }
        }
      }
    }

    const { data: { Search: { search_results: [result], pagination } } } = tester.mock({ query: searchQuery, fixture, variables: testVariables })
    expect(result.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(result.title).to.be.a("string").to.equal(testProduct.title)
    expect(result.brand).to.be.a("string").to.equal(testProduct.brand)

    expect(pagination.total_pages).to.be.a("number").to.equal(20)
    expect(pagination.current_page).to.be.a("number").to.equal(1)
  })
})