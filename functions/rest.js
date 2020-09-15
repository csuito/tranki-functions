const express = require('express')
const app = express()
const { isAuthenticatedRest } = require('../server/resolvers/middleware/auth')


app.get('/products/:productID', isAuthenticatedRest, async (req, res) => {
  const { productID } = req.params
  const Product = require("../server/model/products")
  const DBQuery = require("../server/resolvers/helpers/dbSession")
  try {
    const query = Product.findOne({ productID }).lean()
    const response = await DBQuery(query)
    return res.status(200).json({ success: true, data: response })
  } catch (err) {
    return res.status(500).json({ message: "Unable to fetch product", error: "Internal Server Error" })
  }
})

app.get('/stock/:asin', isAuthenticatedRest, async (req, res) => {
  const { asin } = req.params
  const { client } = require("../client")
  const { requestTypes } = require("../server/constants")
  const DBQuery = require("../server/resolvers/helpers/dbSession")
  const Stock = require('../server/model/stock')
  const { numDaysBetween } = require('../server/resolvers/helpers/dates-between')
  const query = Stock.findOne({ asin })
  const product = await DBQuery(query)

  async function saveStockEstimation(asin, op) {
    const params = {
      type: requestTypes.STOCK_ESTIMATION,
      asin: asin
    }
    try {
      const { data: { stock_estimation } } = await client.get("/request", { params })
      let stockQuery
      if (op === "update") {
        stockQuery = Stock.updateOne({ asin: stock_estimation.asin }, { ...stock_estimation, lastChecked: Date.now() })
      } else {
        stockQuery = Stock.create({ ...stock_estimation, lastChecked: Date.now() })
      }
      const stockEstimation = await DBQuery(stockQuery)
      return stockEstimation
    } catch (e) {
      return res.status(500).json({ message: "Unable to obtain stock estimation", error: "Internal Server Error" })
    }
  }
  if (product) {
    const today = new Date()
    const diff = numDaysBetween(today, product.lastChecked)
    if (diff < 2) {
      return res.status(200).json({ success: true, data: product })
    } else {
      const stockEstimation = await saveStockEstimation(asin, "update")
      return res.status(200).json({ success: true, data: stockEstimation })
    }
  }
  const stockEstimation = await saveStockEstimation(asin)
  return res.status(200).json({ success: true, data: stockEstimation })
})

module.exports = app