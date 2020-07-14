const { requestTypes } = require("../../server/constants")

const getProductCodes = results => results.
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
  map(product => product.asin)

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

const splitProductsByOpType = async (productCodes, products) => {
  const Product = require("../../server/model/products")
  try {
    const existingProducts = await Product.find({ "asin": { $in: productCodes } }).lean()
    const existingProductCodes = existingProducts.map(product => product.asin)
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
  getProductCodes,
  getProductDetails,
  splitProductsByOpType,
  buildUpdateOps,
  buildInsertOps,
  checkArray
}