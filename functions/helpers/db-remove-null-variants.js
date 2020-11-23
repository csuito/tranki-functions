(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const { connectDB, closeDB } = require('../config/db')
  await connectDB()
  const Product = require('../../server/model/products')
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  const { buildUpdateOps } = require('../helpers/hookHelpers')
  let products = await Product.find({ variants: { $exists: true, $not: { $size: 0 } } }).lean()
  products = products.filter(p => p.variants.some(v => v === null))
  let productsToRemove = products
    .map(p => ({ ...p, variants: p.variants.filter(v => v) }))
    .filter(p => p.variants.length === 0)
  let productsToUpdate = products
    .map(p => ({ ...p, variants: p.variants.filter(v => v) }))
    .filter(p => p.variants.length > 0)
  let productIdsToRemove = productsToRemove.map(p => p._id)
  let objectIDS = productsToRemove.map(p => p.objectID)
  let departments = {}
  productsToRemove.forEach(p => {
    if (departments[p.department]) {
      departments[p.department] += 1
    } else {
      departments[p.department] = 1
    }
  })
  console.log({ productsToRemove: productsToRemove.length, productsToUpdate: productsToUpdate.length, departments: departments })
  // await index.deleteObjects(objectIDS)
  // await Product.deleteMany({ _id: { $in: productIdsToRemove } })
  // for (let product of productsToUpdate) {
  //   const { _id, variants } = product
  //   await Product.updateOne({ _id }, { $set: { variants } })
  // }
  await closeDB()
})()