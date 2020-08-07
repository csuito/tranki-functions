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
        if (product) {
          await Product.create(product)
          return product
        } else {
          throw new Error('Unable to find product')
        }
      }
    } catch (err) {
      throw new Error("Unable to find product")
    }
  })

module.exports = getProduct