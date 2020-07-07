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
      console.log("retrieved products; ready for preprocessing")

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
      console.log("results preprocessing done, ready to save to DB")

      await Product.create(products)
      console.log("saved products to DB")

      const index = algoliaClient.initIndex("products")
      await index.saveObjects(products, { autoGenerateObjectIDIfNotExist: true })
      console.log("saved products to Algolia")

      return res.status(200)
    } catch (e) {
      console.log("failed to complete job\n", { e })
      return res.status(500)
    }
  })
}