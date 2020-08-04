const { client } = require("../../client")
const { requestTypes } = require("../../server/constants")

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
const getPrimeProductCodes = results => results.
  map(({ data: [page] }) => {
    switch (page.request.type) {
      case requestTypes.CATEGORY:
        return page.result.category_results
      case requestTypes.BESTSELLERS:
        return page.result.bestsellers
      case requestTypes.SEARCH:
        return page.result.search_results
    }
  }).
  reduce((a, b) => a.concat(b), []).
  filter(product => containsRequiredProperties(product)).
  map(product => product.asin)

/**
 * Retrieves product details from rainforest API and filters out non prime products
 * @param {array} productCodes 
 * @param {object} query 
 * @returns {array}
 */
const getProductDetails = async (productCodes, query = {}) => {
  const getProducts = productCodes.map(asin => client.get("/request", {
    params: { type: requestTypes.PRODUCT, asin },
    timeout: 35000
  }))

  const { bestseller = false, department = "", category = "", offer = false } = query

  try {
    const productDetails = await Promise.all(getProducts)
    return productDetails.
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
  } catch (err) {
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

    const existingProducts = await Product.find({ "asin": { $in: productCodes } }).lean()

    const existingProductCodes = existingProducts.map(({ asin }) => asin)

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
const buildUpdateOps = products => checkArray(products) ? products.map(product => ({
  updateOne: {
    filter: { asin: product.asin },
    update: { ...product },
    upsert: true
  }
})) : []

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
  product.is_prime &&
  product.link

module.exports = {
  getDownloadLinks,
  getPrimeProductCodes,
  getProductDetails,
  splitProductsByOpType,
  buildUpdateOps,
  buildInsertOps,
  checkArray
}