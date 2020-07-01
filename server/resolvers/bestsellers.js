/**
 * Returns a list of products based on a search_term
 * @param {*} args
 */
const getBestsellers = async (_, { url, page = 1, total_pages }) => {
  const { client } = require("../../client")
  const { requestTypes } = require("../constants")

  const params = {
    type: requestTypes.BESTSELLERS,
    url,
    page,
    total_pages,
  }

  try {
    const { data: { bestsellers, pagination } } = await client.get("/", { params })
    return { bestsellers, pagination }
  } catch (e) {
    return { success: false }
  }
}

module.exports = getBestsellers