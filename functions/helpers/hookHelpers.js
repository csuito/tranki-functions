const getProductCodes = results => results.
  map(({ data: [page] }) => {
    switch (page.request.type) {
      case "category":
        return page.result.category_results
      case "bestsellers":
        return page.result.bestsellers
    }
  }).
  reduce((a, b) => a.concat(b), []).
  map(product => product.asin)

const getProductDetails = async (productCodes, query = {}) => {
  const { client } = require("../../client")
  const { requestTypes } = require("../../server/constants")

  const getProducts = productCodes.map(asin => client.get("/", { params: { type: requestTypes.PRODUCT, asin } }))
  const { bestseller = false, department = "", category = "", offer = false } = query

  try {
    const productDetails = await Promise.all(getProducts)
    return productDetails.
      map(({ data: { product } }) => ({
        ...product,
        category,
        department,
        bestseller,
        offer
      }))
    // .filter(product => product.price && product.is_prime)
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