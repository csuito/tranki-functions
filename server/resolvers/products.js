const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getProducts = combineResolvers(
  isAuthenticated,
  async (_, { department = null, category = null }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    try {
      let dbQuery = {}
      if (department) dbQuery.department = department
      if (category) dbQuery.category = category
      const query = Product.find(dbQuery).lean()
      return await DBQuery(query)
    } catch (err) {
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getProducts