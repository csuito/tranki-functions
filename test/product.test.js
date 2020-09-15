// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")
const { constraintDirectiveTypeDefs } = require("graphql-constraint-directive")

describe("test graphql PRODUCT queries", () => {
  const productQuery = `
    query getProduct($asin: ID!) {
      product(asin: $asin) {
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
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid product query", async () => {
    const invalidQuery = `
    query getProduct($asin: ID!) {
      product(asin: $asin) {
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
        product: {
          ...testProduct
        }
      }
    }

    const { data: { product } } = tester.mock({ query: productQuery, fixture, variables: testVariables })
    expect(product.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(product.title).to.be.a("string").to.equal(testProduct.title)
    expect(product.brand).to.be.a("string").to.equal(testProduct.brand)
  })
})