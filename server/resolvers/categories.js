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
      const aggr = Product.aggregate([
        { $match: { department: department } },
        {
          $group: {
            _id: "department",
            categories: {
              $addToSet: "$category"
            }
          }
        }])
      const response = await DBQuery(aggr)
      let categories = response[0].categories
      const products = categories.map(category =>
        DBQuery(Product.find({ department, category }).limit(6)))
      const categoryProdcts = await Promise.all(products)
      categories = categories.map((name, idx) => ({ name, products: categoryProdcts[idx] }))
      return categories
    } catch (err) {
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getCategories