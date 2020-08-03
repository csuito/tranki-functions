const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Returns a list of bestsellers
 * @param {*} args
 */
const getBestsellers = combineResolvers(
  isAuthenticated,
  async (_, args) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")

    try {
      const query = Product.find({ bestseller: true }).lean()

      return await DBQuery(query)
    } catch (err) {
      await closeDB()

      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getBestsellers