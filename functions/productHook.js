module.exports = async (req, res) => {

  const { collection: { name: collectionName } } = req.body
  console.log("Body: ", JSON.stringify(req.body))

  if (!req.query || !req.query.category || !req.query.department) {
    throw new Error("No department or category specified")
  }
  if (process.env.NODE_ENV === "local") {
    require("dotenv").config()
  }

  const { connectDB, closeDB } = require("./config/db")
  const { sendSlackMessage } = require('./bots/slack')
  const AllSettled = require('promise.allsettled')
  const { client } = require('../client')
  const { requestTypes } = require('../server/constants')
  const algoliaTransform = require('./helpers/algolia-transform')
  const { getDownloadLinks, waitFor, splitUp, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray, getShippingInfo, getSpec } = require("./helpers/hookHelpers")

  try {
    await connectDB()
  } catch (err) {
    throw new Error("Unable to connect DB")
  }

  try {
    const { result_set: { download_links: { json: { pages } } } } = req.body
    const downloadLinks = getDownloadLinks(pages)
    console.log("Download links retrieved - ready to get products", `${downloadLinks && downloadLinks.length ? downloadLinks.length : 0}`)
    const results = await downloadLinks[0]
    const { department, category, bestseller = false, offer = false } = req.query
    let products = results.data
      .map(({ result: { product, frequently_bought_together, also_viewed, also_bought } }) => {
        return {
          ...product,
          frequently_bought_together: frequently_bought_together ? frequently_bought_together.products : [],
          also_viewed,
          also_bought,
          category: category.trim().toLowerCase(),
          department: department.trim().toLowerCase(),
          bestseller,
          offer
        }
      })
      .filter(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        return weightSpec && dimensionSpec
      })
      .map(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
        return { ...p, ft3Vol, lb3Vol, weight }
      })

    // products = splitUp(products, 3)[2]
    let _allVariants = []
    for (let product of products) {
      if (product.variants && product.variants.length > 0) {
        const variants = product.variants || []
        // console.log(`Getting product: ${product.asin} variants. A total of ${variants.length} variants`)
        const promises = variants.map(v => client.get("/request", {
          params: { type: requestTypes.PRODUCT, asin: v.asin },
          timeout: 350000
        }))
        _allVariants = [..._allVariants, ...promises]
      }
    }
    console.log(`Found ${_allVariants.length} variants`)
    let allVariants = []
    // Batching and throttling requests if there are more than 100 variants
    if (_allVariants.length > 800) {
      console.log("Batching variants")
      const numBatches = Math.ceil(_allVariants.length / 250)
      const variantBatches = splitUp(_allVariants, numBatches)
      console.log({ numBatches })
      for (let batch of variantBatches) {
        try {
          console.time("Sleep")
          await waitFor(2000)
          console.timeEnd("Sleep")
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
      .map(v => v.data.product)

    products = products
      .map(p => {
        const variants = p.variants
        if (variants && variants.length > 0) {
          console.log(`Finding ${variants.length} variants for product with ASIN ${p.asin}`)
          let detailedVariants = []
          for (let v of variants) {
            let detailedVariant = allVariants.find(av => av.asin === v.asin)
            if (detailedVariant) {
              const { weightSpec, dimensionSpec } = getSpec(detailedVariant)
              if (weightSpec && dimensionSpec) {
                const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
                detailedVariants.push({ ...detailedVariant, ft3Vol, lb3Vol, weight, dimensions: [] })
              }
            }
          }
          return { ...p, variants: detailedVariants }
        }
        return p
      })

    let { existingProducts, newProducts } = await splitProductsByOpType(products)

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
        const algoliaProducts = newProducts.map(p => algoliaTransform(p, department, category))
        const { objectIDs } = await index.saveObjects(algoliaProducts, { autoGenerateObjectIDIfNotExist: true })
        console.log(`Saved ${algoliaClient.length} new products in Algolia`)
        inserts = buildInsertOps(newProducts, objectIDs)
      }
      const Product = require("../server/model/products")
      console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })
      const allProducts = [...updates, ...inserts]
      await Product.bulkWrite(allProducts)
      console.log("Saved products in DB")
      await sendSlackMessage({ collectionName, updates: updates.length, inserts: inserts.length, success: true })
      await closeDB()
      return res.send()
    }
  } catch (e) {
    console.log({ collectionName })
    console.log("ProductHook root", e)
    await sendSlackMessage({ collectionName, success: false, error: e })
    await closeDB()
    return res.end()

  }
}