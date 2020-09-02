const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const FlatFeeDepartments = ["Ropa y Calzado"]

/**
 * Returns review data for a single product
 * @param {*} args
 */
const getShippingCosts = combineResolvers(
  // isAuthenticated,
  async (_, { asins }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")

    const query = Product.find(
      {
        $or:
          [
            { asin: { $in: asins } },
            { variants: { $elemMatch: { asin: { $in: asins } } } }
          ]
      })

    let products = await DBQuery(query)

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

    products = products.map(p => {
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

    const flatFeeProducts = products.filter(p => FlatFeeDepartments.includes(p.department))
    const dynamicFeeProducts = products.filter(p => !FlatFeeDepartments.includes(p.department))

    let airCost = 0, seaCost = 0, minVol = 0.33, courierFtPrice = 14, courierLbPrice = 12, minWeight = 1

    for (let i = 0; i < dynamicFeeProducts.length; i++) {
      const p = dynamicFeeProducts[i]

      let weight = false, dimensions = false,
        dimensionUnit = false, weightUnit = false,
        ft3Vol = false

      if (p.specifications && p.specifications.length > 0) {
        let { weightSpec, dimensionSpec } = getSpecs(p)
        if (dimensionSpec) {
          dimensionSpec = dimensionSpec[0]
          dimensionSpec = dimensionSpec.split(" ").filter(x => x)
          dimensionUnit = dimensionSpec[dimensionSpec.length - 1]
          const dimensionCalc = dimensionSpec.reduce((prev, curr) => curr && !isNaN(curr) ? prev * curr : prev, 1)
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
      sea: finalSeaCost < 10 ? 10 : finalSeaCost
    }

  })

module.exports = getShippingCosts