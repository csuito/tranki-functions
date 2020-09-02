const { client } = require("../../client")
const { requestTypes } = require("../../server/constants")

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
    switch (curr.request_parameters.type) {
      case requestTypes.CATEGORY:
        return prev.concat(curr.category_results)
      case requestTypes.BESTSELLERS:
        return prev.concat(curr.bestsellers)
      case requestTypes.SEARCH:
        return prev.concat(curr.search_results)
    }
  }, [])
  .filter(product => containsRequiredProperties(product))
  .map(product => product.asin)


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
    let productDetails = await Promise.all(getProducts)

    /** 
     * The commented code will allow us to fetch variants details, 
     * instead of using the short object that comes with the parent object 
     ***/

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

    const allVariants = await Promise.all(_allVariants)

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
                const price = variant.price || variant.buybox_winner ? variant.buybox_winner.price : false
                const attributes = variant.attributes && variant.attributes.length > 0 ? variant.attributes : false
                const specifications = variant.specifications && variant.specifications.length > 0 ? variant.specifications : false
                const images = variant.images && variant.images.length > 0 ? variant.images : false
                return !isEmpty(variant) && price && images && attributes && specifications ? ({
                  title, link, price: variant.price || variant.buybox_winner.price,
                  specifications,
                  // dimensions: { name: "size", value: variant.dimensions },
                  asin: variant.asin, image: variant.image, images: variant.images, attributes: variant.attributes
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
  // product.is_prime &&
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