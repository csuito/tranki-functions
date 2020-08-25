const { orders, order, createOrder, updateOrder, userOrders } = require("./orders")
const { createUser, updateUser, addUserAddress, updateUserAddress, addUserProduct, user, users, activeUsers, changeUserStatus } = require("./users")
module.exports = {
  Query: {
    orders,
    order,
    userOrders,
    user,
    users,
    activeUsers,
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
    addUserProduct,
    changeUserStatus,
  },
  Address: {
    __resolveType(data, ctx, info) {
      if (data.country === "VEN") {
        return info.schema.getType("VenezuelanAddress")
      }
      return info.schema.getType("GenericAddress")
    }
  },
}