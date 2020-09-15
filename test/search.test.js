// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")
const { constraintDirectiveTypeDefs } = require("graphql-constraint-directive")

describe("test graphql SEARCH queries", () => {
  const searchQuery = `
    query search($search_term: String!) {
      search(search_term: $search_term) {
        search_results {
         asin
         title
         brand
         prices {
           name
           raw
           symbol
           value
           currency
         }
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
    brand: "Samsung",
    prices: [
      {
        name: "primary",
        raw: "1000.00",
        symbol: "$",
        currency: "USD",
        value: 1000.00
      }
    ]
  }

  const testVariables = {
    search_term: "Samsung MicroSD card"
  }

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid search query", () => {
    const invalidQuery = `
    query search($search_term: String!) {
      search(search_term: $search_term) {
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
        search: {
          search_results: [testProduct],
          pagination: {
            total_pages: 20,
            current_page: 1
          }
        }
      }
    }

    const { data: { search: { search_results: [result], pagination } } } = tester.mock({ query: searchQuery, fixture, variables: testVariables })
    expect(result.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(result.title).to.be.a("string").to.equal(testProduct.title)
    expect(result.brand).to.be.a("string").to.equal(testProduct.brand)

    const price = result.prices[0]
    expect(price.currency).to.be.a("string").to.equal(testProduct.prices[0].currency)
    expect(price.symbol).to.be.a("string").to.equal(testProduct.prices[0].symbol)
    expect(price.value).to.be.a("number").to.equal(testProduct.prices[0].value)
    expect(price.name).to.be.a("string").to.equal(testProduct.prices[0].name)
    expect(price.raw).to.be.a("string").to.equal(testProduct.prices[0].raw)

    expect(pagination.total_pages).to.be.a("number").to.equal(20)
    expect(pagination.current_page).to.be.a("number").to.equal(1)
  })
})