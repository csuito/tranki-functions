const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("Test graphql queries", () => {
  const productQuery = gql`
    query getProduct($asin: ID!) {
      Product(asin: $asin) {
        asin
        title
        brand
      }
    }
  `

  const searchQuery = gql`
    query search($search_term: String!) {
      Products(search_term: $search_term) {
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
    product: {
      asin: testProduct.asin
    },
    search: {
      search_term: "iphone X"
    }
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("fails on invalid product query", async () => {
    const invalidQuery = gql`
    query getProduct($asin: ID!) {
      Product(asin: $asin) {
        asin
        title
        invalid_field
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables.product })
  })

  it("should pass on valid product query", () => {
    tester.test(true, { query: productQuery, variables: testVariables.product })
  })

  it("should return mocked fields on product query", () => {
    const fixture = {
      data: {
        Product: {
          ...testProduct
        }
      }
    }

    const { data: { Product } } = tester.mock({ query: productQuery, fixture, variables: testVariables.product })
    expect(Product.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(Product.title).to.be.a("string").to.equal(testProduct.title)
    expect(Product.brand).to.be.a("string").to.equal(testProduct.brand)
  })

  it("should fail on invalid search query", () => {
    const invalidQuery = gql`
    query search($search_term: String!) {
      Products(search_term: $search_term) {
         asin
         title
         invalid_field
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables.search })
  })

  it("should pass on valid search query", () => {
    tester.test(true, { query: searchQuery, variables: testVariables.search })
  })

  it("should return mocked fields on search query", () => {
    const fixture = {
      data: {
        Products: [
          { ...testProduct }
        ]
      }
    }

    const { data: { Products: [result] } } = tester.mock({ query: searchQuery, fixture, variables: testVariables.search })
    expect(result.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(result.title).to.be.a("string").to.equal(testProduct.title)
    expect(result.brand).to.be.a("string").to.equal(testProduct.brand)
  })
})