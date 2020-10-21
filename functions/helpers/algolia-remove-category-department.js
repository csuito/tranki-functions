(async () => {
  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  let allAlgoliaProducts = []
  try {
    const index = algoliaClient.initIndex("products")
    const callback = (hits) => {
      const products = hits.map(h => ({
        ...h,
        category: h.category.trim().toLowerCase(), department: h.department.trim().toLowerCase()
      }))
      allAlgoliaProducts = [...allAlgoliaProducts, ...products]
    }
    index.browseObjects({
      batch: callback,
      query: '',
      filters: 'category:"telefonos celulares"'
    }).then(async () => {
      const allProducts = await DBQuery(Product.find({ category: "telefonos celulares" }))
      const objectIDS = allAlgoliaProducts
        .filter(a => !allProducts.find(p => p.objectID === a.objectID))
        .map(a => a.objectID)
      allProducts.filter(p => objectIDS.includes(p.objectID))
      console.log({ objectIDS: objectIDS.length, allProducts: allProducts.length })
      //await index.deleteObjects(objectIDS)
    }).catch(e => {
      console.log(e)
    })

  } catch (e) {
    console.log(e)
  }
})()