const { orders, order, createOrder, updateOrder, userOrders } = require("./orders")
const { createUser, updateUser, addUserAddress, updateUserAddress, removeUserAddress, addUserProduct, user, users, activeUsers, changeUserStatus, userExists } = require("./users")
const { onBoardStripeUser, removeCustomerCard, listCustomerCards } = require('./stripe')

module.exports = {
  Query: {
    orders,
    order,
    userOrders,
    user,
    users,
    activeUsers,
    userExists,
    listCustomerCards,
    shipping: require('./shipping-cost'),
    product: require("./product"),
    products: require("./products"),
    categories: require("./categories"),
    search: require("./search"),
    stock: require("./stock"),
    reviews: require("./reviews"),
    bestsellers: require("./bestsellers"),
    banners: require("./banners"),
    departments: require("./departments")
  },
  Mutation: {
    createOrder,
    updateOrder,
    createUser,
    updateUser,
    addUserAddress,
    updateUserAddress,
    removeUserAddress,
    addUserProduct,
    changeUserStatus,
    onBoardStripeUser,
    removeCustomerCard
  },
  Address: {
    __resolveType(data, ctx, info) {
      if (data.country === "Venezuela") {
        return info.schema.getType("VenezuelanAddress")
      } else {
        return info.schema.getType("GenericAddress")
      }
    }
  },
}