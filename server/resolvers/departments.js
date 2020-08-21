const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {string} asin - amazon product id
 */
const getDepartments = combineResolvers(
  isAuthenticated,
  async () => {
    const Department = require("../model/departments")
    const DBQuery = require("./helpers/dbSession")
    try {
      const query = Department.find().lean()
      return await DBQuery(query)
    } catch (err) {
      throw new Error("Unable to fetch departments")
    }
  })

module.exports = getDepartments