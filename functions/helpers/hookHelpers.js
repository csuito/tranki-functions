const { requestTypes } = require("../../server/constants")

/**
 * Retrieves product codes from rainforest collections API results
 * filters out non-prime products
 * @param {array} results 
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
  filter(product => product.is_prime).
  map(product => product.asin)

/**
 * Retrieves product details from rainforest API and filters out non prime products
 * @param {array} productCodes 
 * @param {object} query 
 */
const getProductDetails = async (productCodes, query = {}) => {
  const { client } = require("../../client")

  const getProducts = productCodes.map(asin => client.get("/", { params: { type: requestTypes.PRODUCT, asin } }))
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

const buildUpdateOps = products => checkArray(products) ? products.map(product => ({
  updateOne: {
    filter: { asin: product.asin },
    update: { ...product },
    upsert: true
  }
})) : []

const buildInsertOps = (products, objectIDs) => checkArray(products) ? products.map((product, i) => ({
  insertOne: {
    document: { ...product, objectID: objectIDs[i] },
  }
})) : []

const checkArray = arr => Array.isArray(arr) && arr.length >= 1

module.exports = {
  getPrimeProductCodes,
  getProductDetails,
  splitProductsByOpType,
  buildUpdateOps,
  buildInsertOps,
  checkArray
}