const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const { getProductDetails } = require('../../functions/helpers/hookHelpers')

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
      const dbResponse = await DBQuery(query)
      if (!dbResponse) {
        const product = await getProductDetails([asin], { category: 'variant' })
        const newProduct = Product.create(product[0])
        return await DBQuery(newProduct)
      } else
        return dbResponse
    } catch (err) {
      throw new Error("Unable to find product")
    }
  })

module.exports = getProduct