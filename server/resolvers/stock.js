const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Retrieves a single product's stock estimation
 * @param {string} asin - amazon product id
 */
const getStockEstimation = combineResolvers(
  isAuthenticated,
  async (_, { asin }) => {
    const { client } = require("../../client")
    const { requestTypes } = require("../constants")

    const params = {
      type: requestTypes.STOCK_ESTIMATION,
      asin
    }

    try {
      const { data: { stock_estimation } } = await client.get("/request", { params })
      return stock_estimation
    } catch (e) {
      return { success: false }
    }
  })

module.exports = getStockEstimation