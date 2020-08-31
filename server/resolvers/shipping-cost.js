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
    const query = Product.find({ asin: { $in: asins } })
    const products = await DBQuery(query)

    const flatFeeProducts = products.filter(p => FlatFeeDepartments.includes(p.department))
    const dynamicFeeProducts = products.filter(p => !FlatFeeDepartments.includes(p.department))

    let airCost = 0, seaCost = 0, minVol = 0.33, courierFtPrice = 12, courierLbPrice = 12, minWeight = 1

    for (let i = 0; i < dynamicFeeProducts.length; i++) {
      const p = dynamicFeeProducts[i]
      let weight = false, dimensions = false, dimensionSpec = false,
        dimensionUnit = false, weightSpec = false, weightUnit = false,
        ft3Vol = false

      if (p.specifications && p.specifications.length > 0) {
        weightSpec = p.specifications.find(s => s.name === "Peso del envío" || s.name === "Peso del producto")
        dimensionSpec = p.specifications.find(s => s.name === "Dimensiones del producto")

        if (dimensionSpec) {
          dimensionSpec = dimensionSpec.value.split(";")
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
          weightUnit = weightSpec[weightSpec.length - 1].toLowerCase()
          // Ounces to pound conversion
          if (weightUnit === "onzas") {
            weight = weight * 0.0625
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

    return {
      air: airCost / 0.85,
      sea: seaCost / 0.85
    }

  })

module.exports = getShippingCosts