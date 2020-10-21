const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getProducts = combineResolvers(
  isAuthenticated,
  async (_, { department = null, category = null, page = 1, limit = 10 }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    try {
      let dbQuery = {}
      if (department) dbQuery.department = department
      if (category) dbQuery.category = category
      const query = Product.paginate(dbQuery, { page, limit })
      const products = await DBQuery(query)
      return products.docs
    } catch (err) {
      console.log(err)
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getProducts