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
    const DBQuery = require("./helpers/dbSession")
    const Stock = require('../model/stock')
    const { numDaysBetween } = require('./helpers/dates-between')
    const query = Stock.findOne({ asin })
    const product = await DBQuery(query)

    async function saveStockEstimation(asin, op) {
      const params = {
        type: requestTypes.STOCK_ESTIMATION,
        asin
      }
      try {
        const { data: { stock_estimation } } = await client.get("/request", { params })
        let stockQuery
        if (op === "update") {
          stockQuery = Stock.updateOne({ asin: stock_estimation.asin }, { ...stock_estimation, lastChecked: Date.now() })
        } else {
          stockQuery = Stock.create({ ...stock_estimation, lastChecked: Date.now() })
        }
        await DBQuery(stockQuery)
        return stock_estimation
      } catch (e) {
        return { success: false }
      }
    }

    if (product) {
      const today = new Date()
      const diff = numDaysBetween(today, product.lastChecked)
      if (diff < 2) {
        return product
      } else {
        return saveStockEstimation(asin, "update")
      }
    }
    return saveStockEstimation(asin)
  })

module.exports = getStockEstimation