const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const { getProductDetails } = require('../../functions/helpers/hookHelpers')

/**
 * Retrieves a product by id
 * @param {string} asin - amazon product id
 */
const getProduct = combineResolvers(
  isAuthenticated,
  async (_, { productID }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    try {
      const query = Product.findOne({ productID }).lean()
      return await DBQuery(query)
    } catch (err) {
      throw new Error("Unable to find product")
    }
  })

module.exports = getProduct