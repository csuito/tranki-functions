(async () => {
  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  let allAlgoliaProducts = []
  const callback = (hits) => {
    const products = hits.map(h => ({
      ...h,
      category: h.category.trim().toLowerCase(), department: h.department.trim().toLowerCase()
    }))
    allAlgoliaProducts = [...allAlgoliaProducts, ...products]
  }
  index.browseObjects({
    batch: callback
  }).then(async () => {
    console.log({ allAlgoliaProducts: allAlgoliaProducts[0] })
    await index.saveObjects(allAlgoliaProducts, { autoGenerateObjectIDIfNotExist: false })
  })
})()