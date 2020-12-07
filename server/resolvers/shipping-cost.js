const { combineResolvers } = require('graphql-resolvers')
const { isAuthenticated } = require('./middleware/auth')
const { flatFeeDepartments, requestTypes } = require('../constants')
const { client } = require('../../client')
const AllSettled = require('promise.allsettled')
const { getCourierCosts } = require('../../functions/helpers/hookHelpers')
const { connectDB, closeDB } = require("../../functions/config/db")
const algoliaClient = require("../../functions/config/algolia")()
const index = algoliaClient.initIndex("products")


/**
 * Returns review data for a single product
 * @param {*} args
 */
const getShippingCosts = combineResolvers(
  isAuthenticated,
  async (_, { input, stock = true }) => {
    let asins = input
      .map(a => a.productID)

    if (asins.length === 0) {
      return new Error('No asins provided')
    }

    try {
      await connectDB()
    } catch (e) {
      throw new Error('Unable to start DB session')
    }

    // DB
    const Product = require("../model/products")
    const Stock = require("../model/stock")

    // Helpers
    const { numDaysBetween } = require('./helpers/dates-between')
    const today = new Date()
    let in_stock = new Set()
    let check_stock = new Set()
    let price_changes = []

    // Queries
    const stockQuery = Stock.find({ asin: { $in: asins } })
    const productsQuery = Product.find(
      {
        $or:
          [
            { variants: { $elemMatch: { asin: { $in: asins } } } },
            { productID: { $in: asins } }
          ]
      })

    // Fetching products and stock estimations in database
    let [products, stocks] = await Promise.all([productsQuery, stockQuery])

    // Adding asin not found in the stock table
    for (asin of asins) {
      const stock = stocks.find(s => s.asin === asin)
      if (!stock) {
        check_stock.add(asin)
      }
      if (stock && !stock.in_stock) {
        check_stock.add(asin)
      }
    }

    // Checking stock estimations present in the DB
    for (let stock of stocks) {
      check_stock.add(stock.asin)
      // let diff = numDaysBetween(today, stock.lastChecked)
      // if (diff < 0) {
      //   if (stock && stock.in_stock) {
      //     in_stock.add(stock.asin)
      //   }
      // }
      // else {
      //   check_stock.add(stock.asin)
      // }
    }

    // Fetching products or variants requested by the user
    products = products
      .map(p => {
        if (asins.includes(p.productID)) {
          return p
        }
        if (p.variants && p.variants.length > 0) {
          const variant = p.variants.find(v => asins.includes(v.asin))
          if (variant) {
            const { weight, ft3Vol, lb3Vol } = variant
            if (weight && ft3Vol && lb3Vol) {
              return variant
            } else {
              const { weight, ft3Vol, lb3Vol } = p
              return { ...variant, weight: weight, ft3Vol: ft3Vol, lb3Vol: lb3Vol }
            }
          }
        }
      })

    // If these 2 lenghts do not match, it means we have parent and variants of the same document
    if (products.length !== asins.length) {
      for (let a of asins) {
        const parentProduct = products.find(p => p.productID === a)
        if (!parentProduct) {
          const _parentProduct = products.find(p => p.variants && p.variants.find(v => v.asin === a))
          if (_parentProduct) {
            const variant = _parentProduct.variants.find(v => v.asin === a)
            products.push(variant)
          }
        }
      }
    }

    // Obtaining fresh stock_estimation
    if (stock) {
      const stockEstimations = Array.from(check_stock).map(s => {
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

      /**
       * Checking for out of stock products
       */
      let dbOps = []
      for (estimation of allEstimations) {

        const { quantity } = input.find(i => i.productID === estimation.asin)
        const product = products.find(p => p.productID === estimation.asin || p.asin === estimation.asin)
        const productIsInStock = product && estimation.in_stock && estimation.availability_message.toLowerCase().trim() === "disponible" && estimation.stock_level > quantity

        if (productIsInStock) {
          let currProductPrice
          const { buybox_winner = {} } = product
          const { price = false, rrp = false } = buybox_winner

          // Checking for price updates
          if (rrp) { currProductPrice = rrp }
          if (price) { currProductPrice = price }

          if (currProductPrice.value !== estimation.price.value) {
            price_changes.push({ productID: product.productID || product.asin, newPrice: estimation.price.value })
            if (product.productID) {
              dbOps.push(Product.updateOne({ _id: product._id }, { $set: { 'buybox_winner.price': estimation.price } }))
              dbOps.push(index.partialUpdateObject({ buybox_winner: { ...buybox_winner, price: estimation.price }, objectID: product.objectID }))
            } else {
              dbOps.push(Product.updateOne({ "variants.asin": product.asin }, { $set: { 'variants.$.buybox_winner.price': estimation.price } }))
            }
          }
          in_stock.add(estimation.asin)
        }

        // Updating or deleting stock and products
        const existingRegistry = stocks.find(s => s.asin === estimation.asin)
        if (existingRegistry) {
          if (productIsInStock) {
            dbOps.push(Stock.updateOne({ asin: existingRegistry.asin }, { ...estimation, lastChecked: new Date() }))
          } else {
            if (existingRegistry.stock_failure > 1) {
              dbOps.push(Stock.deleteOne({ _id: existingRegistry._id }))
              dbOps.push(Product.deleteOne({ _id: product._id }))
              dbOps.push(index.deleteObject(product.objectID))
            } else {
              dbOps.push(Stock.updateOne({ _id: existingRegistry._id }, { $set: { lastChecked: new Date() }, $inc: { stock_failure: 1 } }))
            }
          }
        } else {
          if (productIsInStock) {
            dbOps.push(Stock.create({ ...estimation }))
          } else {
            dbOps.push(Stock.create({ ...estimation, in_stock: false, stock_failure: 1 }))
          }
        }
      }

      in_stock = Array.from(in_stock)
      check_stock = Array.from(check_stock)

      if (dbOps.length > 0) {
        await Promise.all(dbOps)
      }
    }

    // Calculating shipping and processing costs for all dynamic and static products that are in stock
    if (stock) products = products.filter(p => in_stock.includes(p.productID))
    const flatFeeProducts = products.filter(p => flatFeeDepartments.includes(p.department))
    const dynamicFeeProducts = products.filter(p => !flatFeeDepartments.includes(p.department))

    let orderDimensions = 0, orderWeight = 0,
      orderVolWeight = 0, minVol = 0.33,
      courierFtPrice = 15, courierLbPrice = 5.5,
      minWeight = 1, totalProductsPrice = 0

    for (let i = 0; i < dynamicFeeProducts.length; i++) {

      const p = dynamicFeeProducts[i]
      let { lb3Vol, ft3Vol, weight, buybox_winner, price } = p
      const { quantity: qty } = input.find(i => i.productID === p.productID)
      let productPrice = buybox_winner && buybox_winner.price ? buybox_winner.price.value : price.value
      const productPriceChanged = price_changes.find(pc => pc.productID === p.productID)
      if (productPriceChanged) productPrice = productPriceChanged.newPrice

      totalProductsPrice += productPrice
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

    // Shipping price
    const finalAirPrice = airCost / markup
    const finalSeaPrice = seaCost / markup
    // Stripe price
    const airStripeFee = ((((finalAirPrice + totalProductsPrice) * 3.9) / 100) + 1) + (totalProductsPrice * 0.07)
    const seaStripeFee = ((((finalSeaPrice + totalProductsPrice) * 3.9) / 100) + 1) + (totalProductsPrice * 0.07)
    // Handle fee
    const totalSeaFee = seaStripeFee + 1
    const totalAirFee = airStripeFee + 1

    await closeDB()

    return {
      air: finalAirPrice < 15 ? 15 : finalAirPrice,
      sea: finalSeaPrice < 10 ? 10 : finalSeaPrice,
      price_changes,
      in_stock,
      seaCost,
      airCost,
      totalProductsPrice,
      weight: orderWeight,
      dimensions: orderDimensions,
      volumetric_weight: orderVolWeight,
      airFee: airStripeFee,
      seaFee: seaStripeFee,
      totalAirFee,
      totalSeaFee
    }
  })

module.exports = getShippingCosts