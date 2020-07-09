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
      console.log(`[${new Date().toLocaleString()}]: retrieved products ready for preprocessing`)

      let products = results.
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

      console.log(`[${new Date().toLocaleString()}]: results preprocessing done, ready to save to DB`)

      // check mongo 
      // if there's no products (1st time): 
      // - saveObjects to algolia first, then get back the objectIds and add it to items, create in mongo
      // else:
      // - retrieve mongo products by asin
      // - split products array in 2 jobs: 1) existing products, 2) new products
      // - for new products, do 1st time algo
      // - for existing products, update products in mongo then add to algolia

      const index = algoliaClient.initIndex("products")
      const { objectIDs } = await index.saveObjects(products, {
        autoGenerateObjectIDIfNotExist: true
      })
      console.log(`[${new Date().toLocaleString()}]: saved products to Algolia`)

      const updates = products.map((product, i) => ({
        updateOne: {
          filter: { asin: product.asin },
          update: { ...product, objectID: objectIDs[i] },
          upsert: true
        }
      }))

      Product.bulkWrite(updates)
      console.log(`[${new Date().toLocaleString()}]: saved products to DB`)

      return res.status(200).end()
    } catch (error) {
      console.log(`[${new Date().toLocaleString()}]: failed to complete job\n`, { error })
      return res.status(500).end()
    }
  })
}