
// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const { constraintDirectiveTypeDefs } = require('graphql-constraint-directive')
const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql CATEGORIES queries", () => {
  const categoriesQuery = `
    query getDepartments($department: String!) {
      categories(department: $department) {
        name
        products {
          title
          brand
          asin
        }
      }
    }
  `

  const testVariables = {
    department: "Bebe"
  }

  const testResponse = [
    {
      name: "Bebe",
      products: [
        {
          title: "Some title",
          brand: "Some brand",
          asin: "XSSFDA"
        },
        {
          title: "Some title",
          brand: "Some brand",
          asin: "XSSFDA"
        },
        {
          title: "Some title",
          brand: "Some brand",
          asin: "XSSFDA"
        }
      ]
    }
  ]

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid product query", async () => {
    const invalidQuery = `
    query getDepartments($department: String!) {
      categories(department: $department) {
        name
        products {
          title
          brand
          asin
          invalid_field
          }
        }
      }
    `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid categories query", () => {
    tester.test(true, { query: categoriesQuery, variables: testVariables })
  })

  it("should return mocked fields on catgories query", () => {
    const fixture = {
      data: {
        categories: testResponse
      }
    }
    const { data: { categories } } = tester.mock({ query: categoriesQuery, fixture, variables: testVariables })
    expect(categories).to.be.a("array")
    categories.forEach((c, i) => {
      const og = fixture.data.categories[i]
      expect(c.name).to.be.a("string").and.be.equal(og.name)
    })
  })

})