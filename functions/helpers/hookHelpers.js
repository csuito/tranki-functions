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
const getProductDetails = async (products, query = {}) => {
  // So we can reduce the products array if needed
  // products = products.slice(products.length - 2)
  const getProducts = products.map(asin => client.get("/request", {
    params: { type: requestTypes.PRODUCT, asin },
    timeout: 350000
  }))
  const { bestseller = false, department = "", category = "", offer = false } = query
  try {
    const productDetails = await Promise.all(getProducts)


    /** 
     * The commented code will allow us to fetch variants details, 
     * instead of using the short object that comes with the parent object 
     ***/

    // let productVariants = productDetails.map(p => { return p.data && p.data.product.variants ? p.data.product.variants : [] })
    // const mergedVariants = productVariants.map(v => v && v.length ? v.map(_v => v.asin) : "")
    // const _allVariants = mergedVariants.map(v => v ? client.get("/request", {
    //   params: { type: requestTypes.PRODUCT, asin: v.asin },
    //   timeout: 350000
    // }) : {})
    // const allVariants = await Promise.all(_allVariants)
    // productVariants = productVariants.map(v => {
    //   return v && v.length ?
    //     v.map(_v => allVariants.find(av => av.asin === _v.asin))
    //     : []
    // })


    const allProducts = productDetails.
      map(({ data: { product, frequently_bought_together, also_viewed, also_bought } }, idx) => ({
        ...product,
        frequently_bought_together,
        also_viewed,
        also_bought,
        category,
        department,
        bestseller,
        offer,
        // variants: productDetails[idx]
      }))
    return allProducts
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