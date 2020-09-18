(async () => {
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  const products = await DBQuery(Product.deleteMany({ category: "Comidas preparadas" }))

  // const objectIDS = products.map(p => p.objectID)

  // const callback = (hits) => {
  //   console.log({ hits })
  // }

  // try {
  //   const response = await index.deleteObjects(objectIDS)
  //   console.log({ response })
  // } catch (err) {
  //   console.log(err)
  // }


})();