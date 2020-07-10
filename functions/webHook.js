module.exports = (req, res) => {
  const db = require("./config/db")()
  const Product = require("../server/model/products")

  db.once("open", async () => {
    const axios = require("axios")
    const algoliaClient = require("./config/algolia")()

    const { bestseller, department, category, offer } = req.query
    const { result_set: { download_links: { json: { pages } } } } = req.body
    const downloadLinks = pages.map(page => axios.get(page))

    try {
      const results = await Promise.all(downloadLinks)
      console.log("Retrieved products - ready for preprocessing")

      const products = results.
        map(({ data: [page] }) => {
          switch (page.request.type) {
            case "category":
              return page.result.category_results
            case "bestsellers":
              return page.result.bestsellers
          }
        }).
        reduce((a, b) => a.concat(b), []).
        map(item => ({
          ...item,
          bestseller,
          department,
          category,
          offer
        }))

      console.log("Results preprocessing done - ready to save to DB")
      const productCodes = products.map(product => product.asin)
      const existingProducts = await Product.find({ "asin": { $in: productCodes } }).lean()
      const existingProductCodes = existingProducts.map(product => product.asin)
      const newProducts = products.filter(({ asin }) => !existingProductCodes.includes(asin))

      const index = algoliaClient.initIndex("products")

      console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: existingProducts.length + newProducts.length })

      if (Array.isArray(existingProducts) && existingProducts.length >= 1) {
        await index.saveObjects(existingProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        console.log("Updated existing products in Algolia")
      }

      let objectIDs = []
      if (Array.isArray(newProducts) && newProducts.length >= 1) {
        const { objectIDs: ids } = await index.saveObjects(newProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        objectIDs = [...ids]
        console.log(`Saved ${objectIDs.length} new products in Algolia`)
      }

      console.log("Ready to define operations")

      const updates = Array.isArray(existingProducts) && existingProducts.length >= 1 ? existingProducts.map(product => ({
        updateOne: {
          filter: { asin: product.asin },
          update: { ...product },
          upsert: true
        }
      })) : []

      const inserts = Array.isArray(newProducts) && newProducts.length >= 1 ? newProducts.map((product, i) => ({
        insertOne: {
          document: { ...product, objectID: objectIDs[i] },
        }
      })) : []

      console.log("Operations breakdown:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })

      await Product.bulkWrite([...updates, ...inserts])
      console.log("Saved products in DB")

      return res.sendStatus(200)
    } catch (error) {
      console.log("Failed to complete job\n", { error })
      return res.sendStatus(500)
    }
  })
}