const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getCategories = combineResolvers(
  isAuthenticated,
  async (_, { department }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    try {
      const query = Product.aggregate([
        { $match: { department: department } },
        {
          $group: {
            _id: "department",
            categories: {
              $addToSet: "$category"
            }
          }
        }])
      const response = await DBQuery(query)
      return response[0].categories
    } catch (err) {
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getCategories