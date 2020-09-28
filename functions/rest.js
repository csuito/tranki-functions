const express = require('express')
const app = express()
const { isAuthenticatedRest } = require('../server/resolvers/middleware/auth')
const { client } = require('../client')
const { requestTypes } = require('../server/constants')
const algoliaTransform = require('../functions/helpers/algolia-transform')
const { getShippingInfo, getSpec } = require('../functions/helpers/hookHelpers')


app.get('/search', isAuthenticatedRest, async (req, res) => {
  const { q, page = 1 } = req.query
  if (!q) {
    return res.status(400).json({ message: "No query specified", error: "Bad Request" })
  }
  try {
    const response = await client.get("/request", {
      params: { type: requestTypes.SEARCH, search_term: q, page },
      timeout: 15000
    })
    if (response && response.data) {
      const { search_results, pagination } = response.data
      return res.status(200).json({ success: true, data: { results: search_results, pagination } })
    }
  } catch (e) {
    return res.status(500).json({ error: "Internal Server Error", message: "Unable to perform search operations. Please contact support" })
  }
})


app.get('/products/:productID', isAuthenticatedRest, async (req, res) => {
  const { productID } = req.params
  const Product = require("../server/model/products")
  const DBQuery = require("../server/resolvers/helpers/dbSession")
  try {
    const query = Product.findOne({ productID }).lean()
    const response = await DBQuery(query)
    if (!response) {
      const rainForest = await client.get("/request", {
        params: { type: requestTypes.PRODUCT, asin: productID },
        timeout: 15000
      })
      // If we get data returned
      if (rainForest && rainForest.data) {
        let { product } = rainForest.data
        const { weightSpec, dimensionSpec } = getSpec(product)
        // Checking if we can calcualte weight and dimensions
        if (!weightSpec || !dimensionSpec) {
          // If not just return the product as it came
          return res.status(200).json({ success: true, data: product })
        } else {
          // Calcualting weight and dimensions
          const { weight, ft3Vol, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
          product = { ...product, weight, ft3Vol, lb3Vol }
          const algoliaClient = require("../functions/config/algolia")()
          const index = algoliaClient.initIndex("products")
          // Saving product in algolia
          product = { ...product, productID: product.asin, department: "tranki", category: "populares", store: "Amazon" }
          const algoProduct = algoliaTransform(product, "tranki", "populares")
          const { objectID } = await index.saveObject(algoProduct, { autoGenerateObjectIDIfNotExist: true })
          product.objectID = objectID
          const createQuery = Product.create(product)
          await DBQuery(createQuery)
          return res.status(200).json({ success: true, data: product })
        }
      }
    }
    return res.status(200).json({ success: true, data: response })
  } catch (err) {
    console.error(err)
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
        stockQuery = Stock.updateOne({ asin: stock_estimation.asin }, { ...stock_estimation, lastChecked: Date.now() }, { new: true })
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