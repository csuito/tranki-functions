// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql STOCK_ESTIMATION queries", () => {
  const stockQuery = gql`
    query getStock($asin: ID!) {
      stock(asin: $asin) {
        asin
        stock_level
        min_quantity
        price {
          value
          currency
          raw
        }
        is_prime
        in_stock
      }
    }
  `

  const testProduct = {
    asin: "B06XWZWYVP",
    stock_level: 25,
    min_quantity: 1,
    price: {
      value: 39.99,
      currency: "USD",
      raw: "39.99"
    },
    is_prime: true,
    in_stock: true
  }

  const testVariables = {
    asin: testProduct.asin
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid stock_estimation query", async () => {
    const invalidQuery = gql`
    query getStock($asin: ID!) {
      stock(asin: $asin) {
        asin
        stock_level
        min_quantity
        invalid_field
        price {
          value
          currency
          raw
        }
        is_prime
        in_stock
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid stock_estimation query", () => {
    tester.test(true, { query: stockQuery, variables: testVariables })
  })

  it("should return mocked fields on stock_estimation query", () => {
    const fixture = {
      data: {
        stock: {
          ...testProduct
        }
      }
    }

    const { data: { stock } } = tester.mock({ query: stockQuery, fixture, variables: testVariables })
    expect(stock.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(stock.stock_level).to.be.a("number").to.equal(testProduct.stock_level)
    expect(stock.min_quantity).to.be.a("number").to.equal(testProduct.min_quantity)
    expect(stock.is_prime).to.be.a("boolean").to.equal(testProduct.is_prime)
    expect(stock.in_stock).to.be.a("boolean").to.equal(testProduct.in_stock)
    expect(stock.price.raw).to.be.a("string").to.equal(testProduct.price.raw)
    expect(stock.price.value).to.be.a("number").to.equal(testProduct.price.value)
    expect(stock.price.currency).to.be.a("string").to.equal(testProduct.price.currency)
  })
})