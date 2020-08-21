const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {string} asin - amazon product id
 */
const getBanners = combineResolvers(
  isAuthenticated,
  async () => {
    const Banner = require("../model/banners")
    const DBQuery = require("./helpers/dbSession")
    try {
      const query = Banner.find().lean()
      return await DBQuery(query)
    } catch (err) {
      throw new Error("Unable to fetch banners")
    }
  })

module.exports = getBanners