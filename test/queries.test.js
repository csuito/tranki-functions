const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("Test graphql queries", () => {
  const query = gql`
    query getProduct($asin: ID!) {
      Product(asin: $asin) {
        asin
        title
        brand
      }
    }
  `

  const testProduct = {
    asin: "B06XWZWYVP",
    title: "Samsung (MB-ME128GA/AM) 128GB",
    brand: "Samsung"
  }

  const testVariables = {
    asin: testProduct.asin
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("fails on invalid product query", async () => {
    const invalidQuery = gql`
    {
      Product {
        asin
        serialNumber
        description
      }
    }
  `
    tester.test(false, invalidQuery)
  })

  it("should pass on valid product query", () => {
    tester.test(true, { query, variables: testVariables })
  })

  it("should return mocked fields", () => {
    const fixture = {
      data: {
        Product: {
          ...testProduct
        }
      }
    }

    const { data: { Product } } = tester.mock({ query, fixture, variables: testVariables })
    expect(Product.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(Product.title).to.be.a("string").to.equal(testProduct.title)
    expect(Product.brand).to.be.a("string").to.equal(testProduct.brand)
  })
})