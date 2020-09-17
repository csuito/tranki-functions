const inputs = require('./inputs')
const stripeSchema = require('./stripe')
const productSchema = require("./product")
const categorySchema = require("./category")
const searchSchema = require("./search")
const stockSchema = require("./stock")
const reviewSchema = require("./reviews")
const bestsellerSchema = require("./bestsellers")
const departmentSchema = require("./department")
const bannerSchema = require("./banner")
const userSchema = require("./users")
const ordersSchema = require("./orders")
const shippingCostSchema = require('./shipping-cost')

const queries = `
  type Query {
    product(productID: ID!): Product
    users: [User]
    userExists(email: String firebaseID: String phoneNumber: String): Boolean!
    orders: [Order]
    activeUsers: [User]
    userOrders(userID: ID!): [Order]
    order(_id: ID!): Order
    user(input: GetUserInput!): User
    products(department: String! category: String): [Product]
    categories(department: String!): [CategoryProduct]!
    search(search_term: String! sort_by: String page: Int): Results
    stock(asin: ID!) : StockEstimation
    reviews(asin: ID! sort_by: String reviewer_type: String review_stars: String page: Int): ReviewsResult
    bestsellers(url: String! page: Int): Bestsellers,
    departments: [Department]
    banners: [Banner]
    shipping(input:[GetShippingCostsInput!]): ShippingCost
    listCustomerCards(input: ListCustomerCardInput!) : [StripeCard]
  }
`

const mutations = `
    type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrder(input: UpdateOrderInput!): Order
    createUser(input: CreateUserInput!): User
    updateUser(input: UpdateUserInput!): User
    addUserAddress(input: AddressInput!): User
    updateUserAddress(input: UpdateAddressInput!): User
    removeUserAddress(input: RemoveUserAddressInput): Boolean
    addUserProduct(input: AddUserProductInput!): Boolean
    changeUserStatus(input: ChangeUserStatusInput!): String
    onBoardStripeUser(input: StripeOnBoardInput!): StripeCard
    removeCustomerCard(input: CustomerCardInput!): Boolean
  }
`

module.exports = `${inputs} ${productSchema} ${categorySchema} ${searchSchema} ${stockSchema} ${reviewSchema} ${bestsellerSchema} ${departmentSchema} ${bannerSchema} ${userSchema} ${ordersSchema} ${shippingCostSchema} ${stripeSchema} ${queries} ${mutations}`