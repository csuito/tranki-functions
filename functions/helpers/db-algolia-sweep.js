(async () => {
  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  const { connectDB, closeDB } = require('../../functions/config/db')
  const Product = require('../../server/model/products')

  try {
    await connectDB()
    const index = algoliaClient.initIndex("products")
    const allProducts = 66000
    const numBatches = allProducts / 1000
    let extraDBProducts = []
    for (let i = 0; i < numBatches; i++) {
      console.log("Batch", i)
      const products = await Product.find({}).skip(i * 1000).limit(1000)
      const productObjectIDs = products.map(p => p.objectID)
      const { results: algoliaProducts } = await index.getObjects(productObjectIDs)
      const algoliaObjectIDs = algoliaProducts.filter(a => a).map(a => a.objectID)
      const extraProducts = productObjectIDs.filter(p => !algoliaObjectIDs.includes(p))
      extraDBProducts = [...extraDBProducts, ...extraProducts]
    }
    console.log({ extraDBProducts })
    console.log({ length: extraDBProducts.length })
    await Product.deleteMany({ objectID: { $in: extraDBProducts } })
  } catch (e) {
    console.log(e)
  }
})()