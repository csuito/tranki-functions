const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {string} asin - amazon product id
 */
const getProduct = combineResolvers(
  isAuthenticated,
  async (_, { asin }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    try {
      const query = Product.findOne({ asin }).lean()
      return await DBQuery(query)
    } catch (err) {
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getProduct