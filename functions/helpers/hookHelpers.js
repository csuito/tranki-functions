const { client } = require("../../client")
const { requestTypes } = require("../../server/constants")
const AllSettled = require('promise.allsettled')
const { sendSlackMessage } = require('../bots/slack')

const isEmpty = (obj) => Object.keys(obj).length === 0 && obj.constructor === Object


/**
 * Returns an array of requests for Rainforest collections results download links 
 * @param {array} pages
 * @returns {array}
 */
const getDownloadLinks = pages => pages.map(page => {
  const urlStart = page.search("/download")
  const url = page.substring(urlStart)
  return client.get(url)
})

/**
 * Retrieves product codes from rainforest collections API results
 * filters out non-prime products
 * @param {array} results
 * @returns {array}
 */

const getPrimeProductCodes = results => results
  .reduce((prev, curr) => prev.concat(curr.data), [])
  .map(data => data.result)
  .reduce((prev, curr) => {
    if (curr && curr.request_parameters) {
      switch (curr.request_parameters.type) {
        case requestTypes.CATEGORY:
          return prev.concat(curr.category_results)
        case requestTypes.BESTSELLERS:
          return prev.concat(curr.bestsellers)
        case requestTypes.SEARCH:
          return prev.concat(curr.search_results)
        case requestTypes.PRODUCT:
          return prev.concat(curr.product)
      }
    }
    return prev
  }, [])
  .filter(product => containsRequiredProperties(product))
  .map(product => product.asin)

/**
 * Splits array into N parts
 * @param {*} arr 
 * @param {*} n 
 */
function splitUp(arr, n) {
  var rest = arr.length % n,
    restUsed = rest,
    partLength = Math.floor(arr.length / n),
    result = []

  for (var i = 0; i < arr.length; i += partLength) {
    let end = partLength + i, add = false
    if (rest !== 0 && restUsed) {
      end++
      restUsed--
      add = true
    }
    result.push(arr.slice(i, end))
    if (add) {
      i++
    }
  }
  return result
}

/**
 * Sets timeout for n milliseconds
 * @param {Number} ms 
 */
function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const getSpec = (product) => {
  if (!product || !product.specifications || product.specifications.length === 0) {
    return { weightSpec: null, dimensionSpec: null }
  }
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

const getShippingInfo = (weightSpec, dimensionSpec, qty, options = {}) => {
  const { minVol = false, minWeight = false } = options
  let weight, dimensions, dimensionUnit, weightUnit, ft3Vol, lb3Vol
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

    if (ft3Vol && minVol && ft3Vol < minVol) {
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

    if (weight && minWeight && weight < minWeight) {
      weight = minWeight
    }
  }
  return {
    weight, dimensions, dimensionUnit, weightUnit, ft3Vol, lb3Vol
  }
}

const getCourierCosts = ({ lb3Vol, ft3Vol, weight, courierFtPrice, courierLbPrice }) => {
  if (courierFtPrice && courierLbPrice) {
    let ft3Price = courierFtPrice
    let lbPrice = courierLbPrice
    let flightVol = lb3Vol * lbPrice
    let plainWeight = weight * lbPrice
    let maxFlight = Math.max(flightVol, plainWeight)
    return {
      ft3Vol,
      lb3Vol,
      ft3Price,
      weight,
      flightVol,
      ft3Price,
      lbPrice,
      plainWeight,
      seaCost: (ft3Vol * ft3Price),
      airCost: maxFlight
    }
  }
}

/**
 * Retrieves product details from rainforest API and filters out non prime products
 * @param {array} productCodes 
 * @param {object} query 
 * @returns {array}
 */
const getProductDetails = async (products, query = {}) => {
  // So we can reduce the products array if needed
  // products = products.slice(products.length - 1)
  // console.log(`Test mode: Fetching ${products.length} products`)
  const getProducts = products.map(asin => client.get("/request", {
    params: { type: requestTypes.PRODUCT, asin, language: 'es_US' },
    timeout: 350000
  }))
  const { bestseller = false, department = "", category = "", offer = false } = query
  try {
    let productDetails = []
    // Batching and throttling requests if there are more than 100 products
    if (getProducts.length > 500) {
      console.log("Product Batching")
      const numBatches = Math.ceil(getProducts.length / 250)
      const batches = splitUp(getProducts, numBatches)
      console.log({ numBatches })
      for (let batch of batches) {
        try {
          await waitFor(2000)
          console.time("Products")
          console.log("Batch length: ", batch.length)
          const newProducts = await AllSettled(batch)
          productDetails = [...productDetails, ...newProducts]
          console.timeEnd("Products")
        } catch (err) {
          // await sendSlackMessage({ collectionName, success: false, error: err })
          throw new Error(err)
        }
      }
    } else {
      try {
        productDetails = await AllSettled(getProducts)
      } catch (err) {
        // await sendSlackMessage({ collectionName, success: false, error: err })
        throw new Error(err)
      }
    }

    productDetails = productDetails
      .filter(p => p.status === "fulfilled")
      .map(p => p.value)
      .filter(p => p.data && p.data.product && p.data.product.buybox_winner)


    const productVariants = productDetails
      .map(p => {
        const { product } = p.data
        return product
          && product.variants
          && product.variants.length > 0
          ? { variants: product.variants, parent: product.asin } : {}
      })
      .filter(p => p.variants && p.variants.length > 0 ?
        p.variants.filter(v => !v || !v.images || !v.price).length > 0 : false)

    console.log(`Fetch ${productVariants.reduce((p, c) => p + c.variants.length, 0)} variants`)

    const _allVariants = productVariants
      .reduce((p, c) => p.concat(c.variants), [])
      .map(v => v.asin)
      .map(asin => {
        return client.get("/request", {
          params: { type: requestTypes.PRODUCT, asin },
          timeout: 350000
        })
      })

    let allVariants = []
    // Batching and throttling requests if there are more than 100 variants
    if (_allVariants.length > 500) {
      console.log("Batching variants")
      const numBatches = Math.ceil(_allVariants.length / 250)
      const variantBatches = splitUp(_allVariants, numBatches)
      console.log({ numBatches })
      for (let batch of variantBatches) {
        try {
          await waitFor(2000)
          console.time("variantBatch")
          console.log("Batch length: ", batch.length)
          const newVariants = await AllSettled(batch)
          allVariants = [...allVariants, ...newVariants]
          console.timeEnd("variantBatch")
        } catch (err) {
          // await sendSlackMessage({ collectionName, success: false, error: err })
          throw new Error(err)
        }

      }
    } else {
      try {
        allVariants = await AllSettled(_allVariants)
      } catch (err) {
        throw new Error(err)
        // await sendSlackMessage({ collectionName, success: false, error: err })
      }
    }


    allVariants = allVariants
      .filter(v => v.status === "fulfilled")
      .map(v => v.value)
      .filter(v => v.data && v.data.product && v.data.product.buybox_winner)

    productDetails = productDetails
      .map(p => {
        const { product } = p.data
        let pVariants = productVariants
          .find(v => product.asin === v.parent)
        if (pVariants) {
          pVariants = pVariants.variants
            .map(v => { return v && v.asin ? { ...allVariants.find(av => av.data.request_parameters.asin === v.asin), title: v.title, link: v.link } : {} })
            .map(v => {
              if (v && v.data && v.data.product && !isEmpty(v.data.product)) {
                const variant = v.data.product
                const title = v.title
                const link = v.link
                const price = variant.buybox_winner
                const attributes = variant.attributes && variant.attributes.length > 0 ? variant.attributes : false
                const specifications = variant.specifications && variant.specifications.length > 0 ? variant.specifications : false
                const images = variant.images && variant.images.length > 0 ? variant.images : false
                return !isEmpty(variant) && price && images && attributes && specifications ? ({
                  title, link, price: variant.price || variant.buybox_winner.price,
                  specifications,
                  // dimensions: { name: "size", value: variant.dimensions },
                  asin: variant.asin, productID: variant.asin, image: variant.image, images: variant.images, attributes: variant.attributes
                }) : false
              }
              return false
            })
            .filter(v => v && v.price && v.images && v.images.length > 0 && v.link && v.attributes && v.attributes.length > 0)
        }
        const result = {
          ...p, data: { ...p.data, product: { ...product, variants: pVariants } }
        }
        return result
      })

    const allProducts = productDetails.
      map(({ data: { product, frequently_bought_together, also_viewed, also_bought } }) => ({
        ...product,
        frequently_bought_together,
        also_viewed,
        also_bought,
        category,
        department,
        bestseller,
        offer
      }))
    return allProducts
  } catch (err) {
    console.log(err)
    // await sendSlackMessage({ collectionName, success: false, error: err })
    throw new Error("Unable to retrieve product details")
  }
}

/**
 * Divides existing and new products
 * @param {array} products 
 * @returns {object}
 */
const splitProductsByOpType = async products => {
  const Product = require("../../server/model/products")
  try {
    const productCodes = products.map(({ asin }) => asin)
    const existingProducts = await Product.find({ "productID": { $in: productCodes } }).lean()
    const existingProductCodes = existingProducts.map(({ productID }) => productID)
    const newProducts = products.filter(({ asin }) => !existingProductCodes.includes(asin))
    return { existingProducts, newProducts }
  } catch (err) {
    throw new Error("Unable to retrieve existing products from DB")
  }
}

/**
 * Builds products DB update operations
 * @param {array} products
 * @returns {array}
 */
const buildUpdateOps = products => checkArray(products) ? products.map(product => {
  return {
    updateOne: {
      filter: { productID: product.productID },
      update: { ...product },
      upsert: true
    }
  }

}) : []

/**
 * Builds products DB insert operations
 * @param {array} products 
 * @param {array} objectIDs
 * @returns {array}
 */
const buildInsertOps = (products, objectIDs) => checkArray(products) ? products.map((product, i) => ({
  insertOne: {
    document: { ...product, objectID: objectIDs[i] },
  }
})) : []

/**
 * Checks that array has at least 1 item
 * @param {array} arr 
 * @returns {boolean}
 */
const checkArray = arr => Array.isArray(arr) && arr.length >= 1

/**
 * Checks that product has all required properties
 * @param {object} product 
 */
const containsRequiredProperties = product => product &&
  product.asin &&
  product.title &&
  // product.is_prime &&
  product.link

module.exports = {
  getDownloadLinks,
  getPrimeProductCodes,
  getProductDetails,
  splitProductsByOpType,
  buildUpdateOps,
  buildInsertOps,
  checkArray,
  getShippingInfo,
  getSpec,
  getCourierCosts
}