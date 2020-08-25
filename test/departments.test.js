// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql DEPARTMENTS queries", () => {
  const departmentsQuery = gql`
    query getDepartments {
      departments {
        name
        active
        image
      }
    }
  `

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid departments query", async () => {
    const invalidQuery = gql`
      query getDepartments {
        departments {
          name
          active
          image
          invalid_field
        }
      }
    `
    tester.test(false, { query: invalidQuery })
  })

  it("should pass on valid departments query", () => {
    tester.test(true, { query: departmentsQuery })
  })

  it("should return mocked fields on departments query", () => {
    const fixture = {
      data: {
        departments: [
          {
            name: "Department name",
            active: true,
            image: "https://image.com/?w=400&h=200"
          },
          {
            name: "Department name",
            active: true,
            image: "https://image.com/?w=400&h=200"
          },
          {
            name: "Department name",
            active: true,
            image: "https://image.com/?w=400&h=200"
          }
        ]
      }
    }
    const { data: { departments } } = tester.mock({ query: departmentsQuery, fixture })

    expect(departments).to.be.a("array")

    departments.forEach((p, i) => {
      const og = fixture.data.departments[i]
      expect(p.name).to.be.a("string").and.be.equal(og.name)
      expect(p.active).to.be.a("boolean").and.be.equal(og.active)
      expect(p.image).to.be.a("string").and.be.equal(og.image)
    })
  })

})