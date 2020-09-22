module.exports = async (req, res) => {
  console.log("Body: ", JSON.stringify(req.body))
  const { collection: { name: collectionName } } = req.body

  if (!req.query || !req.query.category || !req.query.department) {
    throw new Error("No department or category specified")
  }

  if (process.env.NODE_ENV === "local") {
    require("dotenv").config()
  }

  const { connectDB, closeDB } = require("./config/db")
  const { sendSlackMessage } = require('./bots/slack')
  const algoliaTransform = require('./helpers/algolia-transform')

  try {
    await connectDB()
  } catch (err) {
    throw new Error("Unable to connect DB")
  }

  try {

    if (!req.body.result_set || !req.body.result_set.download_links) {
      throw new Error("No downloadable links")
    }

    const { getDownloadLinks, getPrimeProductCodes, getProductDetails, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray, getShippingInfo, getSpec } = require("./helpers/hookHelpers")

    const { result_set: { download_links: { json: { pages } } } } = req.body

    const downloadLinks = getDownloadLinks(pages)

    console.log("Download links retrieved - ready to get products", `${downloadLinks && downloadLinks.length ? downloadLinks.length : 0}`)

    const results = await Promise.all(downloadLinks)

    console.log("Retrieved products - ready for preprocessing", `${results && results.length ? results.length : 0}`)

    let productCodes = getPrimeProductCodes(results)

    productCodes = [...new Set(productCodes)]
    // productCodes = [productCodes[90], productCodes[95]]

    console.log(`Results preprocessing done - ready to get ${productCodes && productCodes.length ? productCodes.length : 0} product details`)

    let products = await getProductDetails(productCodes, req.query)
    products = products
      .filter(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        return weightSpec && dimensionSpec
      })
      .map(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
        return { ...p, ft3Vol, lb3Vol, weight }
      })

    products = products
      .map(p => {
        let variants = p.variants
        if (variants && variants.length) {
          variants = variants
            .map(v => {
              const { weightSpec: variantWeight, dimensionSpec: variantDimension } = getSpec(v)
              if (!variantWeight || !variantDimension) {
                const { weightSpec, dimensionSpec } = getSpec(p)
                const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
                return { ...v, ft3Vol, lb3Vol, weight }
              }
              const { ft3Vol, weight, lb3Vol } = getShippingInfo(variantWeight, variantDimension, 1)
              return { ...v, ft3Vol, lb3Vol, weight }
            })
          return { ...p, variants }
        }
        return p
      })

    console.log(`Products: ${products && products.length > 0 ? products.length : 0}`)

    let { existingProducts, newProducts } = await splitProductsByOpType(products)

    console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: (existingProducts.length + newProducts.length) })

    newProducts = newProducts
      .map(p => ({ ...p, productID: p.asin, store: "Amazon" }))

    if (checkArray(existingProducts) || checkArray(newProducts)) {
      const algoliaClient = require("./config/algolia")()
      const index = algoliaClient.initIndex("products")
      const algoliaProducts = existingProducts.map(p => algoliaTransform(p))
      let updates = []
      if (checkArray(existingProducts)) {
        await index.saveObjects(algoliaProducts, { autoGenerateObjectIDIfNotExist: false })
        console.log(`Updated ${existingProducts.length} products in Algolia`)
        updates = buildUpdateOps(existingProducts)
      }
      let inserts = []
      if (checkArray(newProducts)) {
        const algoliaProducts = newProducts.map(p => algoliaTransform(p, req.query.department, req.query.category))
        const { objectIDs } = await index.saveObjects(algoliaProducts, { autoGenerateObjectIDIfNotExist: true })
        console.log(`Saved ${objectIDs.length} new products in Algolia`)
        inserts = buildInsertOps(newProducts, objectIDs)
      }
      const Product = require("../server/model/products")
      console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })
      const allProducts = [...updates, ...inserts]
      await Product.bulkWrite(allProducts)
      console.log("Saved products in DB")
      await sendSlackMessage({ collectionName, updates: updates.length, inserts: inserts.length, success: true })
    }
    await closeDB()
    return res.status(200).send()
  } catch (err) {
    console.log({ collectionName })
    console.log("Main", err)
    await sendSlackMessage({ collectionName, success: false, error: err })
    await closeDB()
    return res.status(500).send()
  }
}