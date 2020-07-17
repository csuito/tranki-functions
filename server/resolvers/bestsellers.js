const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Returns a list of products based on a search_term
 * @param {*} args
 */
const getBestsellers = combineResolvers(
  isAuthenticated,
  async (_, { url, page = 1 }) => {
    const { client } = require("../../client")
    const { requestTypes } = require("../constants")

    const params = {
      type: requestTypes.BESTSELLERS,
      url,
      page,
    }

    try {
      const { data: { bestsellers, pagination } } = await client.get("/request", { params })
      return { bestsellers, pagination }
    } catch (e) {
      return { success: false }
    }
  })

module.exports = getBestsellers