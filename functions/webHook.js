module.exports = async (req, res) => {
  if (process.env.NODE_ENV === "local") {
    require("dotenv").config()
  }

  const { connectDB, closeDB } = require("./config/db")

  try {
    await connectDB()
  } catch (err) {
    throw new Error("Unable to connect DB")
  }

  try {
    const { getDownloadLinks, getPrimeProductCodes, getProductDetails, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray } = require("./helpers/hookHelpers")

    const { result_set: { download_links: { json: { pages } } } } = req.body

    const downloadLinks = getDownloadLinks(pages)

    console.log("Download links retrieved - ready to get products")

    const results = await Promise.all(downloadLinks)

    console.log("Retrieved products - ready for preprocessing")

    const productCodes = getPrimeProductCodes(results)

    console.log("Results preprocessing done - ready to get product details")

    const products = await getProductDetails(productCodes, req.query)

    console.log(`Products: ${products.length}`)

    const { existingProducts, newProducts } = await splitProductsByOpType(products)

    console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: existingProducts.length + newProducts.length })

    if (checkArray(existingProducts) || checkArray(newProducts)) {
      const algoliaClient = require("./config/algolia")()
      const index = algoliaClient.initIndex("products")

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

      const Product = require("../server/model/products")
      console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })

      await Product.bulkWrite([...updates, ...inserts])
      console.log("Saved products in DB")
    }

    await closeDB()

    return res.status(200).send()
  } catch (err) {
    await closeDB()

    return res.status(500).send()
  }
}