const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getProduct = combineResolvers(
  isAuthenticated,
  async (_, { asin }) => {
    const Product = require("../model/products")

    try {
      await Product.findOne({ asin })
    } catch (e) {
      return { success: false, error: "Internal server error", message: "Unable to find product in DB" }
    }
  })

module.exports = getProduct