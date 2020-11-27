const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")
const { getSpec, getShippingInfo, buildInsertOps } = require('../../functions/helpers/hookHelpers')
const algoliaTransform = require('../../functions/helpers/algolia-transform')
const { requestTypes } = require('../constants')
const { client } = require("../../client")
const AllSettled = require('promise.allsettled')
const { AVG_CLOTHING_FT3, AVG_CLOTHING_LB3, AVG_CLOTHING_WEIGHT, AVG_SHOES_FT3, AVG_SHOES_LB3, AVG_SHOES_WEIGHT } = require('../constants')

/**
 * Retrieves a product by id
 * @param {string} asin - amazon product id
 */
const getProduct = combineResolvers(
  isAuthenticated,
  async (_, { productID }) => {
    const Product = require("../model/products")
    const DBQuery = require("./helpers/dbSession")
    const algoliaClient = require('../../functions/config/algolia')()
    try {
      // First we check if the product is in our DB
      const query = Product.findOne(
        {
          $or:
            [
              { productID },
              { variants: { $elemMatch: { asin: productID } } }
            ]
        }).lean()
      const dbProduct = await DBQuery(query)
      // If not present in the DB
      if (!dbProduct) {
        // Looking for parent product in rainforest
        const { data } = await client.get("/request", {
          params: { type: requestTypes.PRODUCT, asin: productID, language: 'es_US' },
          timeout: 350000
        })
        // Once we get a successful response
        if (data && data.product) {
          let { product } = data

          // Checking if there's price data
          if (!product || !(product.buybox_winner || product.more_buying_choices)) {
            throw new Error("Product did not specify buybox_winner")
          }

          const { buybox_winner, more_buying_choices } = product

          if (buybox_winner) {
            if (!(buybox_winner.price || buybox_winner.rrp)) {
              throw new Error("Product did not specify price")
            }
          }

          if (more_buying_choices && more_buying_choices.length > 0) {
            if (!more_buying_choices[0].price) {
              throw new Error("Product did not specify price")
            }
            product = { ...product, buybox_winner: { price: more_buying_choices[0].price } }
          }

          // Checking for shipping data
          const { weightSpec, dimensionSpec } = getSpec(product)
          let weight, ft3Vol, lb3Vol

          if (weightSpec && dimensionSpec) {
            const shippingInfo = getShippingInfo(weightSpec, dimensionSpec)
            if (shippingInfo && shippingInfo.weight && shippingInfo.ft3Vol && shippingInfo.lb3Vol) {
              weight = shippingInfo.weight
              ft3Vol = shippingInfo.ft3Vol
              lb3Vol = shippingInfo.lb3Vol
            }
          } else {
            const shoes = product.categories.find(c => c.name === "Shoes" || c.name === "Zapatos")
            const clothing = product.categories.find(c => c.name === "Clothing" || c.name === "Ropa")
            if (shoes) {
              ft3Vol = AVG_SHOES_FT3
              lb3Vol = AVG_SHOES_LB3
              weight = AVG_SHOES_WEIGHT
            }
            if (clothing) {
              ft3Vol = AVG_CLOTHING_FT3
              lb3Vol = AVG_CLOTHING_LB3
              weight = AVG_CLOTHING_WEIGHT
            }
          }
          if (weight && ft3Vol && lb3Vol) {
            product = { ...product, productID: product.asin, store: "Amazon", weight, ft3Vol, lb3Vol, department: "tranki", category: "populares" }
            // Tranforming product to be saved in algolia
            const algoliaProduct = algoliaTransform(product, "tranki", "populares")
            const index = algoliaClient.initIndex("products")
            // Saving in algolia
            const { objectID } = await index.saveObject(algoliaProduct, { autoGenerateObjectIDIfNotExist: true })
            product = { ...product, objectID }
            if (product.variants && product.variants.length > 0) {
              const variantASINS = product.variants.map(v => v.asin)
              const _allVariants = variantASINS.map(asin => client.get("/request", {
                params: { type: requestTypes.PRODUCT, asin, language: 'es_US' },
                timeout: 350000
              }))
              let allVariants = await AllSettled(_allVariants)
              allVariants = allVariants
                .filter(v => v.status === "fulfilled")
                .map(v => v.value)
                .filter(v => v.data
                  && v.data.product
                  && v.data.product.asin
                  && v.data.product.buybox_winner
                  && (v.data.product.buybox_winner.price || v.data.product.buybox_winner.rrp)
                  && (v.data.product.main_image || (v.data.product.images && v.data.product.images.length > 0)))
                .map(v => v.data.product)
                .map(v => {
                  const { weightSpec, dimensionSpec } = getSpec(v)
                  if (!weightSpec || !dimensionSpec) {
                    return { ...v, weight, ft3Vol, lb3Vol }
                  } else {
                    const { weight, ft3Vol, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec)
                    return { ...v, weight, ft3Vol, lb3Vol }
                  }
                })
              product.variants = product.variants.map(v => {
                const fullVariant = allVariants.find(av => av.asin === v.asin)
                return { ...fullVariant, title: v.title }
              })
            }
            const inserts = buildInsertOps([product], [objectID])
            // Saving on DB
            await DBQuery(Product.bulkWrite(inserts))
            return product
          } else { throw new Error('Unable to obtain product shipping information') }
        }
      } else {
        // If the product is in the DB and a variant was specified
        if (dbProduct.productID !== productID) {

          const variantIndex = dbProduct.variants
            .map(v => v.asin)
            .indexOf(productID)

          if (variantIndex !== -1) {
            const variant = dbProduct.variants[variantIndex]
            const { weight, ft3Vol, lb3Vol, buybox_winner } = variant
            // If variant already contains all necessary data we return the main product as it is
            if (weight && ft3Vol && lb3Vol && buybox_winner && (buybox_winner.price || buybox_winner.rrp)) {
              return dbProduct
            } else {
              // If not we look for variant's detail
              const { data } = await client.get("/request", {
                params: { type: requestTypes.PRODUCT, asin: productID, language: 'es_US' },
                timeout: 350000
              })
              // Once we obtain data from rainforest
              if (data && data.product) {
                let { product } = data
                // Checking for pricing data
                if (!product || !product.buybox_winner) {
                  throw new Error("Product did not specify buybox_winner")
                }
                const { buybox_winner } = product
                if (!(buybox_winner.price || buybox_winner.rrp)) {
                  throw new Error("Product did not specify price")
                }
                // Checking for shipping data
                const { weightSpec, dimensionSpec } = getSpec(product)
                if (weightSpec && dimensionSpec) {
                  const { weight, ft3Vol, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec)
                  if (weight && ft3Vol && lb3Vol) {
                    product = { ...product, weight, ft3Vol, lb3Vol }
                    // If no shipping info is found we use the parent's
                  } else {
                    product = { ...product, weight: dbProduct.weight, ft3Vol: dbProduct.ft3Vol, lb3Vol: dbProduct.lb3Vol }
                  }
                  // If no shipping info is found we use the parent's
                } else {
                  product = { ...product, weight: dbProduct.weight, ft3Vol: dbProduct.ft3Vol, lb3Vol: dbProduct.lb3Vol }
                }
                dbProduct.variants[variantIndex] = { ...product, title: variant.title }
                // Updating parent product
                await DBQuery(Product.updateOne({ productID }, dbProduct))
                return dbProduct
              }
            }
          } else {
            throw new Error("Variant not present in product's variants array")
          }
        }
        return dbProduct
      }
    } catch (err) {
      throw new Error("Unable to find product")
    }
  })

module.exports = getProduct