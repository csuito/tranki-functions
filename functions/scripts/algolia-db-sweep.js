(async () => {
  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  const { connectDB, closeDB } = require('../config/db')
  const Product = require('../../server/model/products')
  let extraAlgoliaProducts = []
  try {
    await connectDB()
    const index = algoliaClient.initIndex("products")
    const callback = async (hits) => {
      let objectIDs = hits.map(h => h.objectID)
      let products = await Product.find({ objectID: { $in: objectIDs } })
      products = products.map(p => p.objectID)
      let extraObjIds = objectIDs.filter(o => !products.includes(o))
      extraAlgoliaProducts = [...extraAlgoliaProducts, ...extraObjIds]
      console.log({ products: products.length, objectIDs: objectIDs.length, extra: extraObjIds.length })
      console.log({ extraAlgoliaProducts: JSON.stringify(extraAlgoliaProducts), length: extraAlgoliaProducts.length })
    }
    index.browseObjects({
      batch: callback,
      query: '',
      filters: ''
    }).then(async () => {
      console.log({ extraAlgoliaProducts, length: extraAlgoliaProducts.length })
    }).catch(e => {
      console.log(e)
    })
  } catch (e) {
    console.log(e)
  }
})()