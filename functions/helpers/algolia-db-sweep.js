(async () => {
  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  const { connectDB, closeDB } = require('../../functions/config/db')
  const Product = require('../../server/model/products')
  let allAlgoliaProducts = []
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
      // allAlgoliaProducts = [...allAlgoliaProducts, ...hits]
    }
    index.browseObjects({
      batch: callback,
      query: '',
      filters: ''
    }).then(async () => {
      console.log("Done!")
      console.log({ extraAlgoliaProducts: extraAlgoliaProducts, extraProducts: extraAlgoliaProducts.length })
      await closeDB()
      // const allProducts = await DBQuery(Product.find())
      // allProducts = allProducts.map(p => p.objectID)

      // const objectIDSInAlgoliaButNotInDB = allAlgoliaProducts
      //   .map(a => a.objectID)
      //   .filter(a => !allProducts.includes(a))

      // const productsInDBButNotInAlgolia = allProducts
      //   .filter(a => !allAlgoliaProducts.includes(a))

      // console.log({ productsInDBButNotInAlgolia: productsInDBButNotInAlgolia.length, objectIDSInAlgoliaButNotInDB: objectIDSInAlgoliaButNotInDB.length })

      //

    }).catch(e => {
      console.log(e)
    })
  } catch (e) {
    console.log(e)
  }
})()