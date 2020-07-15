module.exports = (req, res) => {
  if (process.env.NODE_ENV === "local") {
    require("dotenv").config()
  }

  const db = require("./config/db")()

  db.once("open", async () => {
    const axios = require("axios")
    const algoliaClient = require("./config/algolia")()
    const { getPrimeProductCodes, getProductDetails, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray } = require("./helpers/hookHelpers")

    try {
      const { result_set: { download_links: { json: { pages } } } } = req.body
      const downloadLinks = pages.map(page => axios.get(page))

      const results = await Promise.all(downloadLinks)

      console.log("Retrieved products - ready for preprocessing")

      const productCodes = getPrimeProductCodes(results)

      console.log("Results preprocessing done - ready to get product details")

      const products = await getProductDetails(productCodes, req.query)

      console.log(`Products: ${products.length}`)

      const { existingProducts, newProducts } = await splitProductsByOpType(products)

      const index = algoliaClient.initIndex("products")

      console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: existingProducts.length + newProducts.length })

      let updates = []
      if (checkArray(existingProducts)) {
        await index.saveObjects(existingProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        console.log(`Updated ${existingProducts.length} products in Algolia`)
        updates = buildUpdateOps(existingProducts)
      }

      let inserts = []
      if (checkArray(newProducts)) {
        const { objectIDs } = await index.saveObjects(newProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        console.log(`Saved ${objectIDs.length} new products in Algolia`)
        inserts = buildInsertOps(newProducts, objectIDs)
      }

      if (checkArray(updates) || checkArray(inserts)) {
        const Product = require("../server/model/products")
        console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })

        await Product.bulkWrite([...updates, ...inserts])
        console.log("Saved products in DB")
      }

      return res.status(200).send()
    } catch (err) {
      console.log({ err })
      return res.status(500).send()
    }
  })
}