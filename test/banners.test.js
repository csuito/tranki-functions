// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")
const { constraintDirectiveTypeDefs } = require('graphql-constraint-directive')

describe("test graphql DEPARTMENTS queries", () => {
  const bannersQuery = `
    query getBanners {
      banners {
        text
        type
        image
      }
    }
  `

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid banners query", async () => {
    const invalidQuery = `
      query getBanners {
        banners {
          text
          type
          image
          invalid_field
        }
      }
    `
    tester.test(false, { query: invalidQuery })
  })

  it("should pass on valid banners query", () => {
    tester.test(true, { query: bannersQuery })
  })

  it("should return mocked fields on banners query", () => {
    const fixture = {
      data: {
        banners: [
          {
            text: "Banner text!",
            type: "referral",
            image: "https://image.com/?w=400&h=200"
          },
          {
            text: "Banner text!",
            type: "referral",
            image: "https://image.com/?w=400&h=200"
          },
          {
            text: "Banner text!",
            type: "referral",
            image: "https://image.com/?w=400&h=200"
          }
        ]
      }
    }
    const { data: { banners } } = tester.mock({ query: bannersQuery, fixture })

    expect(banners).to.be.a("array")

    banners.forEach((p, i) => {
      const og = fixture.data.banners[i]
      expect(p.text).to.be.a("string").and.be.equal(og.text)
      expect(p.type).to.be.a("string").and.be.equal(og.type)
      expect(p.image).to.be.a("string").and.be.equal(og.image)
    })
  })

})