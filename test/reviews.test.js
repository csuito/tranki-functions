// https://easygraphql.com/docs/easygraphql-tester/usage/#mocking-queries-and-mutations
const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql REVIEWS queries", () => {
  const reviewsQuery = gql`
    query getReviews($asin: ID!) {
      reviews(asin: $asin) {
        product {
          asin
          title
          brand
        }
        top_positive {
          title
          rating
        }
        top_critical {
          title
          rating
        }
        reviews {
          title
          rating
        }
        summary {
          rating
          reviews_positive
          reviews_critical
        }
        pagination {
          current_page
          total_pages
          reviews_total
        }
      }
    }
  `

  const testProduct = {
    asin: "B06XWZWYVP",
    title: "Samsung (MB-ME128GA/AM) 128GB",
    brand: "Samsung",
    reviews: {
      top_positive: {
        title: "Awesome product!",
        rating: 5,
      },
      top_critical: {
        title: "Extremely disappointed",
        rating: 1,
      },
    }
  }

  const testVariables = {
    asin: testProduct.asin
  }

  let tester
  before(() => {
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid search query", () => {
    const invalidQuery = gql`
    query getReviews($asin: ID!) {
      reviews(asin: $asin) {
        product {
          asin
          title
          brand
        }
        reviews {
          title
          rating
        }
        invalid_field
      }
    }
  `
    tester.test(false, { query: invalidQuery, variables: testVariables })
  })

  it("should pass on valid search query", () => {
    tester.test(true, { query: reviewsQuery, variables: testVariables })
  })

  it("should return mocked fields on search query", () => {
    const fixture = {
      data: {
        reviews: {
          product: {
            ...testProduct
          },
          top_positive: {
            title: "Awesome product!",
            rating: 5,
          },
          top_critical: {
            title: "Extremely disappointed",
            rating: 1,
          },
          pagination: {
            total_pages: 20,
            current_page: 1
          }
        }
      }
    }

    const { data: { reviews: { product, top_positive, top_critical, pagination } } } = tester.mock({ query: reviewsQuery, fixture, variables: testVariables })
    expect(product.asin).to.be.a("string").to.equal(testProduct.asin)
    expect(product.title).to.be.a("string").to.equal(testProduct.title)

    expect(top_positive.title).to.be.a("string").to.equal(testProduct.reviews.top_positive.title)
    expect(top_positive.rating).to.be.a("number").to.equal(testProduct.reviews.top_positive.rating)

    expect(top_critical.title).to.be.a("string").to.equal(testProduct.reviews.top_critical.title)
    expect(top_critical.rating).to.be.a("number").to.equal(testProduct.reviews.top_critical.rating)

    expect(pagination.total_pages).to.be.a("number").to.equal(20)
    expect(pagination.current_page).to.be.a("number").to.equal(1)
  })
})