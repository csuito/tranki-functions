/**
 * Retrieves a single product's stock estimation
 * @param {*} asin - amazon product id
 */
const getStockEstimation = async (_, { asin }) => {
  const { client } = require("../../client")
  const { requestTypes } = require("../constants")

  const params = {
    type: requestTypes.STOCK_ESTIMATION,
    asin
  }

  try {
    const { data: { stock_estimation } } = await client.get("/", { params })
    return stock_estimation
  } catch (e) {
    return { success: false }
  }
}

module.exports = getStockEstimation