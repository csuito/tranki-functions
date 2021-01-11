const { default: obj } = require('uuid-apikey');

(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  const query = { department: "tranki" /*, category: "perros"*/ }
  let hits = []
  index.browseObjects({
    query: '',
    filters: 'department:tranki', // Empty query will match all records
    batch: batch => {
      hits = hits.concat(batch);
    }
  }).then(async () => {
    const objectIDS = hits.map(h => h.objectID)
    const products = await DBQuery(Product.find(query))
    console.log("Found", { algolia: objectIDS.length, DB: products.length })
    // try {
    //   await index.deleteObjects(objectIDS)
    // } catch (e) {
    //   throw new Error(e)
    // }
    // try {
    //   await DBQuery(Product.deleteMany(query))
    // } catch (e) {
    //   throw new Error(e)
    // }
  })
})();