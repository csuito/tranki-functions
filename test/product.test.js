// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql PRODUCT queries", () => {
  const productQuery = gql`
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

  it("should fail on invalid product query", async () => {
    const invalidQuery = gql`
    query getProduct($asin: ID!) {
      Product(asin: $asin) {
        asin
        title
        invalid_field
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid product query", () => {
    tester.test(true, { query: productQuery, variables: testVariables })
  })

  it("should return mocked fields on product query", () => {
    const fixture = {
      data: {
        Product: {
          ...testProduct
        }
      }
    }

    const { data: { Product } } = tester.mock({ query: productQuery, fixture, variables: testVariables })
    expect(Product.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(Product.title).to.be.a("string").to.equal(testProduct.title)
    expect(Product.brand).to.be.a("string").to.equal(testProduct.brand)
  })
})