const { combineResolvers } = require('graphql-resolvers')
const { isAuthenticated } = require('./middleware/auth')
const { flatFeeDepartments, requestTypes } = require('../constants')
const { client } = require('../../client')
const AllSettled = require('promise.allsettled')
const { getSpec, getShippingInfo, getCourierCosts } = require('../../functions/helpers/hookHelpers')


/**
 * Returns review data for a single product
 * @param {*} args
 */
const getShippingCosts = combineResolvers(
  // isAuthenticated,
  async (_, { input }) => {
    let asins = input
      .map(a => a.asin)

    if (asins.length === 0) {
      return new Error('No asins provided')
    }

    // DB
    const Product = require("../model/products")
    const Stock = require("../model/stock")
    const DBQuery = require("./helpers/dbSession")

    // Helpers
    const { numDaysBetween } = require('./helpers/dates-between')
    const today = new Date()
    let in_stock = []
    let check_stock = []

    // Queries
    const stockQuery = Stock.find({ asin: { $in: asins } })
    const productsQuery = Product.find(
      {
        $or:
          [
            { asin: { $in: asins } },
            { variants: { $elemMatch: { asin: { $in: asins } } } }
          ]
      })

    let price_changed = false

    // Fetching products and stock estimations in database
    let [products, stocks] = await Promise.all([DBQuery(productsQuery), DBQuery(stockQuery)])

    // Adding asin not found in the stock table
    for (asin of asins) {
      const stock = stocks.find(s => s.asin === asin)
      if (!stock) {
        check_stock.push(asin)
      }
    }

    // Checking stock estimations present in the DB
    for (let stock of stocks) {
      let diff = numDaysBetween(today, stock.lastChecked)
      if (diff < 2) {
        if (stock && stock.in_stock) {
          in_stock.push(stock.asin)
        }
      }
      else {
        check_stock.push(stock.asin)
      }
    }

    // Fetching products or variants requested by the user
    products = products
      .map(p => {
        if (asins.includes(p.asin)) {
          return p
        }
        if (p.variants && p.variants.length > 0) {
          const variant = p.variants.find(v => asins.includes(v.asin))
          if (variant) {
            const { weightSpec, dimensionSpec } = getSpec(variant)
            if (dimensionSpec && weightSpec) {
              return variant
            }
            return p
          }
        }
      })

    // Obtaining fresh stock_estimation
    const stockEstimations = check_stock.map(s => {
      const params = {
        type: requestTypes.STOCK_ESTIMATION,
        asin: s
      }
      return client.get("/request", { params })
    })

    let allEstimations = await AllSettled(stockEstimations)


    allEstimations = allEstimations
      .filter(a => a.status === "fulfilled" && a.value.data.stock_estimation)
      .map(a => a.value.data.stock_estimation)

    // Checking fresh estimations and saving or updating in the DB
    let dbOps = []
    for (estimation of allEstimations) {
      if (estimation.in_stock) {
        in_stock.push(estimation.asin)
      }
      const existingRegistry = stocks.find(s => s.asin === estimation.asin)
      const existingProduct = products.find(p => p.asin === estimation.asin)
      const productPrice = existingProduct.buybox_winner.price
      const stockPrice = estimation.price

      if (productPrice.value !== stockPrice.value) {
        price_changed = true
        dbOps.push(DBQuery(Product.updateOne({ asin: existingProduct.asin }, { $set: { "buybox_winner.$.price": { ...stockPrice, symbol: "US$" } } })))
      }
      if (existingRegistry) {
        dbOps.push(DBQuery(Stock.updateOne({ asin: existingRegistry.asin }, { ...estimation, lastChecked: Date.now() })))
      } else {
        dbOps.push(DBQuery(Stock.create(estimation)))
      }
    }

    if (dbOps.length > 0) {
      await Promise.all(dbOps)
    }

    // Calculating shipping costs for all dynamic and static products that are in stock
    products = products.filter(p => in_stock.includes(p.asin))
    const flatFeeProducts = products.filter(p => flatFeeDepartments.includes(p.department))
    const dynamicFeeProducts = products.filter(p => !flatFeeDepartments.includes(p.department))
    let orderDimensions = 0, orderWeight = 0, orderVolWeight = 0,
      minVol = 0.33, courierFtPrice = 15,
      courierLbPrice = 5.5, minWeight = 1

    for (let i = 0; i < dynamicFeeProducts.length; i++) {

      const p = dynamicFeeProducts[i]
      const { lb3Vol, ft3Vol, weight } = p
      const { quantity: qty } = input.find(i => i.asin === p.asin)

      const productFt3Vol = ft3Vol * qty
      const productWeight = weight * qty
      const productLb3Vol = lb3Vol * qty

      orderDimensions += productFt3Vol
      orderWeight += productWeight
      orderVolWeight += productLb3Vol
    }

    orderDimensions = orderDimensions > minVol ? orderDimensions : minVol
    orderWeight = orderWeight > minWeight ? orderWeight : minWeight

    let { airCost, seaCost } = getCourierCosts({
      lb3Vol: orderVolWeight, ft3Vol: orderDimensions,
      weight: orderWeight, courierFtPrice, courierLbPrice
    })

    for (let i = 0; i < flatFeeProducts.length; i++) {
      airCost += 5
      seaCost += 5
    }

    let markup
    if (airCost < 100) markup = 0.85
    if (airCost > 100 && airCost < 999) markup = 0.90
    if (airCost > 1000) markup = 0.95

    const finalAirPrice = airCost / markup
    const finalSeaPrice = seaCost / markup

    return {
      air: finalAirPrice < 15 ? 15 : finalAirPrice,
      sea: finalSeaPrice < 10 ? 10 : finalSeaPrice,
      in_stock,
      price_changed,
      seaCost,
      airCost,
      weight: orderWeight,
      dimensions: orderDimensions,
      volumetric_weight: orderVolWeight
    }

  })

module.exports = getShippingCosts