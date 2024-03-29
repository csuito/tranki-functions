const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Returns a list of products based on a search_term
 * @param {*} args
 */
const search = combineResolvers(
  isAuthenticated,
  async (_, { search_term, sort_by, page = 1 }) => {
    const { client } = require("../../client")
    const { requestTypes, sortOptions: { products: sortOptions } } = require("../constants")

    const params = {
      type: requestTypes.SEARCH,
      search_term,
      page,
      sort_by: sort_by || sortOptions.FEATURED,
    }

    try {
      const { data: { search_results, pagination } } = await client.get("/request", { params })
      return { search_results, pagination }
    } catch (e) {
      return { success: false }
    }
  })

module.exports = search