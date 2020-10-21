(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  const { buildUpdateOps } = require('../helpers/hookHelpers')
  let products = await DBQuery(Product.find({ $or: [{ buybox_winner: { $exists: false } }, { variants: { price: { $exists: false } } }] }).lean())
  let productIds = products.map(p => p._id)
  let objectIDS = products.map(p => p.objectID)
  console.log({ products: products.length })
  //await index.deleteObjects(objectIDS)
  // await DBQuery(Product.deleteMany({ _id: { $in: productIds } }))
})()