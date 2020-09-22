(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const algoliaTransform = require('../helpers/algolia-transform')
  const { buildUpdateOps } = require('../helpers/hookHelpers')
  let products = await DBQuery(Product.find({ productID: "B0813HNTQV" }).lean())
  products = products.map(p => ({ ...p, objectID: null, department: p.department.trim().toLowerCase(), category: p.category.trim().toLowerCase() }))
  console.log("Before", { products })
  products = products.map(p => algoliaTransform(p, "hey", "heya"))
  console.log("After", { products })
})();