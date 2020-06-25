const { client, requestTypes } = require("../../client")

/**
 * Returns a list of products based on a search_term
 * @param {*} search_term
 */
const search = async (_, { search_term }) => {
  const params = {
    type: requestTypes.SEARCH,
    search_term,
  }

  try {
    // TODO: add pagination
    const { data: { search_results, pagination } } = await client.get("/", { params })
    return { search_results, pagination }
  } catch (e) {
    return e
  }
}

module.exports = search