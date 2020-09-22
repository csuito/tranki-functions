const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const { closeDB, connectDB } = require('../../functions/config/db')
const { connect } = require("mongoose")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getCategories = combineResolvers(
  isAuthenticated,
  async (_, { department }) => {
    await connectDB()
    const Product = require("../model/products")
    try {
      const response = await Product.aggregate([
        { $match: { department: department } },
        {
          $group: {
            _id: "department",
            categories: {
              $addToSet: "$category"
            }
          }
        }])
      let categories = response[0].categories
      const products = categories.map(category =>
        Product.find({ department, category }).limit(6))
      const categoryProducts = await Promise.all(products)
      categories = categories.map((name, idx) => ({ name, products: categoryProducts[idx] }))
      await closeDB()
      return categories
    } catch (err) {
      await closeDB()
      throw new Error("Unable to find product in DB")
    }
  })

module.exports = getCategories