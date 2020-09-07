const { combineResolvers } = require('graphql-resolvers')
const { isAuthenticated } = require('./middleware/auth')
const { flatFeeDepartments, requestTypes } = require('../constants')
const { client } = require('../../client')
const AllSettled = require('promise.allsettled')

function getSpecs(product) {
  let weightSpec = product.specifications
    .map(s => ({ value: s.value, name: s.name.replace('\n', '') }))
    .find(s => {
      const name = s.name.toLowerCase().trim()
      return (
        name === "peso del envío" || name === "peso del producto"
        || name === "product weight" || name === "package weight"
      )
    })
  let dimensionSpec = product.specifications
    .map(s => ({ value: s.value, name: s.name.replace('\n', '') }))
    .find(s => {
      const name = s.name.toLowerCase().trim()
      return (
        name === "dimensiones del paquete" || name === "dimensiones del producto"
        || name === "product dimensions" || name === "package dimensions"
      )
    })
  if (dimensionSpec) {
    dimensionSpec = dimensionSpec.value.split(";")
    if (!weightSpec && dimensionSpec && dimensionSpec.length === 2) {
      weightSpec = { name: "peso del producto", value: dimensionSpec[1].trim() }
    }
  }
  return { weightSpec, dimensionSpec }
}

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
        if (stock.in_stock) {
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
            const { weightSpec, dimensionSpec } = getSpecs(variant)
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
      .filter(a => a.status === "fulfilled")
      .map(a => a.value.data.stock_estimation)

    // Checking fresh estimations and saving or updating in the DB
    let newStock = []
    for (estimation of allEstimations) {
      if (estimation.in_stock) {
        in_stock.push(estimation.asin)
      }
      const existingRegistry = stocks.find(s => s.asin === estimation.asin)
      if (existingRegistry) {
        newStock.push(DBQuery(Stock.updateOne({ asin: existingRegistry.asin }, estimation)))
      } else {
        newStock.push(DBQuery(Stock.create(estimation)))
      }
    }

    if (newStock.length > 0) {
      await Promise.all(newStock)
    }

    // Calculating shipping costs for all dynamic and static products that are in stock
    products = products.filter(p => in_stock.includes(p.asin))
    const flatFeeProducts = products.filter(p => flatFeeDepartments.includes(p.department))
    const dynamicFeeProducts = products.filter(p => !flatFeeDepartments.includes(p.department))
    let airCost = 0, seaCost = 0, minVol = 0.33, courierFtPrice = 14, courierLbPrice = 12, minWeight = 1
    for (let i = 0; i < dynamicFeeProducts.length; i++) {

      const p = dynamicFeeProducts[i]
      const { quantity: qty } = input.find(i => i.asin === p.asin)

      let weight = false, dimensions = false,
        dimensionUnit = false, weightUnit = false,
        ft3Vol = false

      if (p.specifications && p.specifications.length > 0) {
        let { weightSpec, dimensionSpec } = getSpecs(p)
        if (dimensionSpec) {
          dimensionSpec = dimensionSpec[0]
          dimensionSpec = dimensionSpec.split(" ").filter(x => x)
          dimensionUnit = dimensionSpec[dimensionSpec.length - 1]
          const dimensionCalc = (dimensionSpec.reduce((prev, curr) => curr && !isNaN(curr) ? prev * curr : prev, 1) * qty)
          // Cm to inches conversion
          if (dimensionUnit === "cm") {
            dimensions = dimensionCalc * 0.0610237
          } else {
            dimensions = dimensionCalc
          }

          ft3Vol = dimensions / 1728
          lb3Vol = dimensions / 166

          if (ft3Vol && ft3Vol > minVol) {
            ft3Vol = minVol
          }
        }
        if (weightSpec) {
          weightSpec = weightSpec.value.split(" ")
          weight = +weightSpec[0]
          weightUnit = weightSpec[weightSpec.length - 1].toLowerCase().trim()
          // Ounces to pound conversion
          if (weightUnit === "onzas" || weightUnit === "ounces") {
            weight = weight / 16
          }

          // Multiplying by quantity
          weight *= qty

          if (weight && weight < minWeight) {
            weight = minWeight
          }
          // Pounds to kg conversion
          weight = weight * 0.453592
        }

        let ft3Price = courierFtPrice
        let lbPrice = courierLbPrice
        let flightVol = lb3Vol * lbPrice
        let plainWeight = weight * lbPrice
        let maxFlight = Math.max(flightVol, plainWeight)

        console.log({
          ft3Vol,
          lb3Vol,
          ft3Price,
          weight,
          flightVol,
          ft3Price,
          lbPrice,
          plainWeight,
          maxFlight
        })

        seaCost += (ft3Vol * ft3Price)
        airCost += maxFlight
      }
    }

    for (let i = 0; i < flatFeeProducts.length; i++) {
      seaCost += 5
      airCost += 5
    }

    const finalAirCost = airCost / 0.85
    const finalSeaCost = seaCost / 0.85

    return {
      air: finalAirCost < 15 ? 15 : finalAirCost,
      sea: finalSeaCost < 10 ? 10 : finalSeaCost,
      in_stock
    }

  })

module.exports = getShippingCosts