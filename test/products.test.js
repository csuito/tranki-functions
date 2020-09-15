// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")
const { constraintDirectiveTypeDefs } = require("graphql-constraint-directive")

describe("test graphql PRODUCTS queries", () => {
  const productsQuery = `
    query getProducts($department: String! $category: String) {
      products(department: $department category: $category) {
        asin
        title
        brand
      }
    }
  `


  const testVariables = {
    department: "Bebe",
    category: "Regalos para recien nacidos"
  }

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid product query", async () => {
    const invalidQuery = `
      query getProducts($department: String! $category: String) {
        products(department: $department category: $category) {
          asin
          title
          brand
          invalid_field
        }
      }
    `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid product query", () => {
    tester.test(true, { query: productsQuery, variables: testVariables })
  })

  it("should return mocked fields on product query", () => {
    const fixture = {
      data: {
        products: [
          {
            asin: "XSSFDA",
            title: "Some title",
            brand: "Some brand"
          },
          {
            asin: "XSSFDA",
            title: "Some title",
            brand: "Some brand"
          },
          {
            asin: "XSSFDA",
            title: "Some title",
            brand: "Some brand"
          }
        ]
      }
    }
    const { data: { products } } = tester.mock({ query: productsQuery, fixture, variables: testVariables })

    expect(products).to.be.a("array")

    products.forEach((p, i) => {
      const og = fixture.data.products[i]
      expect(p.asin).to.be.a("string").and.be.equal(og.asin)
      expect(p.title).to.be.a("string").and.be.equal(og.title)
      expect(p.brand).to.be.a("string").and.be.equal(og.brand)
    })
  })

})