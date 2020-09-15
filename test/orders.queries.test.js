const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const { constraintDirectiveTypeDefs } = require('graphql-constraint-directive')
const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql ORDERS queries", () => {
  const ordersQuery = `
    query getAllOrders {
      orders {
        _id
        cart {
          asin
          price
          qty
          variant
          link
        }
        userID
        email
        total {
          cost
          price
        }
        shipping {
          address {
            __typename

            ... on VenezuelanAddress {
              street
              houseOrAptNumber
              city
              country
              municipality
            }

            ... on GenericAddress {
              street
              houseOrAptNumber
              city
              country
            }
          }
          courier
          total {
            cost
            price
          }
        method
        dimensions
        weight
        eta
        }
      }
    }
  `

  const orderQuery = `
    query getOrder($_id: ID!) {
      order(_id: $_id) {
        _id
        cart {
          asin
          price
          qty
          variant
          link
        }
        userID
        email
        total {
          cost
          price
        }
        payment {
          txID
          method
        }
        shipping {
          address {
            __typename

            ... on GenericAddress {
              street
              houseOrAptNumber
              city
              country
            }

            ... on VenezuelanAddress {
              street
              houseOrAptNumber
              city
              country
              municipality
            }
          }
          courier
          total {
            cost
            price
          }
          method
          dimensions
          weight
          eta
        }
      }
    }
  `

  const testOrder = {
    _id: "12345",
    cart: [
      {
        asin: "12345",
        price: 55.50,
        qty: 2,
        variant: "red",
        supplier: {
          name: "Amazon"
        },
        link: "https://wwww.amazon.com/product-link?asin=B06XWZWYVP&variant=red"
      }
    ],
    userID: "12345",
    firstName: "Test",
    lastName: "User",
    email: "test.user@tranki.app",
    phoneNumber: "04140000000",
    total: {
      price: 100.25
    },
    payment: {
      card: "card_1HPkmBK9woMnl4elgvOkQnUt",
      customer: 'cus_HzqK5jCl0Vt6fM'
    },
    shipping: {
      address: {
        firstName: "Juan",
        lastName: "Perez",
        street: "Avenida Sur 8, La Lagunita",
        houseOrAptNumber: "Edificio La Vista, Piso-5, Torre B",
        country: "Venezuela",
        city: "Caracas",
        state: "Distrito Capital",
        postCode: "1003",
        municipality: "El Hatillo",
        additionalInfo: "Dejar paquete en vigilancia"
      },
      courier: "Tiger Shipping",
      method: "sea",
      dimensions: "1 cubic feet",
      weight: "2 kilograms",
    },
  }

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid orders query", () => {
    const invalidQuery = `
      query getAllOrders {
        orders {
          _id
          userID
          email
          invalidField
        }
      }
    `

    tester.test(false, { query: invalidQuery })
  })

  it("should pass on valid orders query", () => {
    tester.test(true, { query: ordersQuery })
  })

  it("should return mocked fields on orders query", () => {
    const fixture = {
      data: {
        orders: [{ ...testOrder }]
      }
    }

    const { data: { orders: [result] } } = tester.mock({ query: ordersQuery, fixture })
    expect(result._id).to.be.a("string").to.equal(testOrder._id)
    expect(result.userID).to.be.a("string").to.equal(testOrder.userID)
  })

  it("should fail on invalid order query", () => {
    const invalidQuery = `
      query getOrder($_id: ID!) {
        order(_id: $_id) {
          _id
          userID
          email
          invalidField
        }
      }
    `

    tester.test(false, { query: invalidQuery, variables: { _id: "12345" } })
  })

  it("should pass on valid order query", () => {
    tester.test(true, { query: orderQuery, variables: { _id: "12345" } })
  })

  it("should return mocked fields on order query", () => {
    const fixture = {
      data: {
        order: { ...testOrder }
      }
    }

    const { data: { order } } = tester.mock({ query: orderQuery, fixture, variables: { _id: "12345" } })
    expect(order._id).to.be.a("string").to.equal(testOrder._id)
    expect(order.userID).to.be.a("string").to.equal(testOrder.userID)
  })
})
