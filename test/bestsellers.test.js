// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql BESTSELLERS queries", () => {
  const bestsellersQuery = gql`
    query getBestsellers($page: Int) {
      bestsellers(page: $page) {
        bestsellers {
          rank
          position
          asin
          title
          rating
          ratings_total
          price {
            symbol
            currency
            value
            raw
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
    rank: 1,
    position: 1,
    title: "Samsung (MB-ME128GA/AM) 128GB",
    asin: "B06XWZWYVP",
    rating: 4.9,
    ratings_total: 4750,
    price: {
      symbol: "$",
      currency: "USD",
      value: 500,
      raw: "500.00",
    }
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid bestellers query", () => {
    const invalidQuery = gql`
    query getBestsellers {
      bestsellers {
        rank
        position
        asin
        title
      }
    }
  `
    tester.test(false, { query: invalidQuery })
  })

  it("should pass on valid bestsellers query", () => {
    tester.test(true, { query: bestsellersQuery })
  })

  it("should return mocked fields on bestsellers query", () => {
    const fixture = {
      data: {
        bestsellers: {
          bestsellers: [{ ...testProduct }],
          pagination: {
            total_pages: 5,
            current_page: 1
          }
        },
      }
    }

    const { data: { bestsellers: { bestsellers: [result], pagination } } } = tester.mock({ query: bestsellersQuery, fixture, variables: { page: 1 } })
    expect(result.rank).to.be.a("number").to.equal(testProduct.rank)
    expect(result.position).to.be.a("number").to.equal(testProduct.position)
    expect(result.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(result.title).to.be.a("string").to.equal(testProduct.title)
  })
})