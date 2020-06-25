const { client, requestTypes } = require("../../client")

/**
 * Retrieves a single product's stock estimation
 * @param {*} asin - amazon product id
 */
const getStockEstimation = async (_, { asin }) => {
  const params = {
    type: requestTypes.STOCK_ESTIMATION,
    asin
  }

  try {
    const { data: { stock_estimation } } = await client.get("/", { params })
    return stock_estimation
  } catch (e) {
    return e
  }
}

module.exports = getStockEstimation