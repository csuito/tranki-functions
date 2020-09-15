const GraphQLTester = require("easygraphql-tester")
const { expect } = require("chai")

const { constraintDirectiveTypeDefs } = require('graphql-constraint-directive')
const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

describe("test graphql ORDERS mutations", () => {
  const createOrderMutation = `
    mutation createOrder($input: CreateOrderInput!) {
      createOrder(input: $input) {
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
        creationDate
      }
    }
  `

  const updateOrderMutation = `
    mutation updateOrder($input: UpdateOrderInput!) {
      updateOrder(input: $input) {
        _id
        status
      }
    }
  `

  const createOrderInput = {
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
      amount: 100.25
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

  const updateOrderInput = {
    _id: "12345",
    status: "fulfilled"
  }

  let tester
  before(() => {
    tester = new GraphQLTester(`${constraintDirectiveTypeDefs} ${typeDefs}`, resolvers)
  })

  it("should fail on invalid create order mutation", () => {
    const invalidMutation = `
      mutation createOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          cart {
            asin
            price
            qty
            variant
            link
          }
        }
      }
    `

    const input = {
      userID: "12345",
      cart: [
        {
          asin: "12345",
          price: 55.50,
          qty: 2,
          variant: "red",
          link: "https://wwww.amazon.com/product-link?asin=B06XWZWYVP&variant=red"
        }
      ],
    }

    tester.test(false, { query: invalidMutation, variables: { input } })
  })

  it("should pass on valid create order mutation", () => {
    tester.test(true, { query: createOrderMutation, variables: { input: createOrderInput } })
  })

  it("should return mocked fields on create order mutation", () => {
    const result = tester.mock({ query: createOrderMutation, variables: { input: createOrderInput } })
    expect(result).to.be.ok
  })

  it("should fail on invalid update order mutation", () => {
    const invalidMutation = `
    mutation updateOrder($input: UpdateOrderInput!) {
      updateOrder(input: $input) {
        cart {
          asin
          price
          qty
          variant
          link
        }
        invalidField
      }
    }
  `

    const input = {
      _id: "12345",
      cart: [
        {
          asin: "12345",
          price: 55.50,
          qty: 2,
          variant: "red",
          link: "https://wwww.amazon.com/product-link?asin=B06XWZWYVP&variant=red"
        }
      ],
    }

    tester.test(false, { query: invalidMutation, variables: { input } })
  })

  it("should pass on valid update order mutation", () => {
    tester.test(true, { query: updateOrderMutation, variables: { input: updateOrderInput } })
  })

  it("should return mocked fields on update order mutation", () => {
    const result = tester.mock({ query: updateOrderMutation, variables: { input: updateOrderInput } })
    expect(result).to.be.ok
  })
})
