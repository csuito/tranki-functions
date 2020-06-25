const { client } = require("../../client")
const { requestTypes, sortOptions: { products: sortOptions } } = require("../constants")

/**
 * Returns a list of products based on a search_term
 * @param {*} args
 */
const search = async (_, { search_term, sort_by = sortOptions.FEATURED, page = 1 }) => {
  const params = {
    type: requestTypes.SEARCH,
    search_term,
    page,
    sort_by,
  }

  try {
    const { data: { search_results, pagination } } = await client.get("/", { params })
    return { search_results, pagination }
  } catch (e) {
    return e
  }
}

module.exports = search