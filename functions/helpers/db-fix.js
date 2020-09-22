(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const { buildUpdateOps } = require('../helpers/hookHelpers')
  let products = await DBQuery(Product.find().lean())
  products = products.map(p => ({ ...p, department: p.department.trim().toLowerCase(), category: p.category.trim().toLowerCase() }))
  const updates = buildUpdateOps(products)
  await DBQuery(Product.bulkWrite(updates))
})();