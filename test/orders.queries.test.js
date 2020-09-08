const GraphQLTester = require("easygraphql-tester")
const { gql } = require("apollo-server-express")
const { expect } = require("chai")

const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql ORDERS queries", () => {
  const ordersQuery = gql`
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
        payment {
          txID
          method
        }
        shipping {
          address {
            __typename

            ... on VenezuelanAddress {
              streetType
              street
              houseOrAptNumber
              city
              country
              residence
              municipality
              urbanization
            }

            ... on GenericAddress {
              streetType
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

  const orderQuery = gql`
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
              streetType
              street
              houseOrAptNumber
              city
              country
            }

            ... on VenezuelanAddress {
              streetType
              street
              houseOrAptNumber
              city
              country
              residence
              municipality
              urbanization
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
      txID: "12345",
      method: "credit card"
    },
    shipping: {
      address: {
        firstName: "Juan",
        lastName: "Perez",
        street: "Sur 8",
        streetType: "Avenida",
        houseOrAptNumber: "Piso-5, Torre B",
        country: "Venezuela",
        city: "Caracas",
        state: "Distrito Capital",
        postCode: "1003",
        residence: "Loma Linda",
        urbanization: "La Lagunita",
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
    tester = new GraphQLTester(typeDefs, resolvers)
  })

  it("should fail on invalid orders query", () => {
    const invalidQuery = gql`
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

  it("should return correct shipping address __typename on orders query (VenezuelanAddress)", () => {
    const fixture = {
      data: {
        orders: [{ ...testOrder }]
      }
    }

    const { data: { orders: [result] } } = tester.mock({ query: ordersQuery, fixture })
    const address = result.shipping.address
    expect(address.__typename).to.be.a("string").to.equal("VenezuelanAddress")
  })

  it("should fail on invalid order query", () => {
    const invalidQuery = gql`
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

  it("should return correct shipping address __typename on order query (VenezuelanAddress)", () => {
    const fixture = {
      data: {
        order: { ...testOrder }
      }
    }

    const { data: { order: { shipping: { address } } } } = tester.mock({ query: orderQuery, fixture, variables: { _id: "12345" } })
    expect(address.__typename).to.be.a("string").to.equal("VenezuelanAddress")
  })
})
