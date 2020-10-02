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
      const query = Product.findOne(
        {
          $or:
            [
              { productID },
              { variants: { $elemMatch: { asin: productID } } }
            ]
        }).lean()
      console.log({ productID })
      const dbProduct = await DBQuery(query)
      console.log({ dbProduct })
      if (!dbProduct) {
        const [product] = await getProductDetails([{ asin: productID }], { category: 'populares', department: 'tranki' })
        if (product) {
          console.log({ product })
        }
      }
    } catch (err) {
      console.log(err)
      throw new Error("Unable to find product")
    }
  })

module.exports = getProduct