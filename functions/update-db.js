require('dotenv').config()

const { getShippingInfo, getSpec } = require('./helpers/hookHelpers')
const Product = require('../server/model/products')
const { connectDB, closeDB } = require("../functions/config/db");

(async () => {
  await connectDB()
  const products = await Product.find()
  let updates = []
  let withVariants = 0
  for (product of products) {
    let variants = product.variants
    if (variants && variants.length > 0) {
      console.log("Product with variant")
      withVariants++
      variants = variants
        .map(v => {
          let { weightSpec, dimensionSpec } = getSpec(v)
          if (!weightSpec || !dimensionSpec) {
            let { weightSpec: productWeightSpec, dimensionSpec: productDimensionWeight } = getSpec(product)
            const { ft3Vol, weight, lb3Vol } = getShippingInfo(productWeightSpec, productDimensionWeight, 1)
            return { ...v._doc, ft3Vol, lb3Vol, weight }
          }
          const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
          return { ...v._doc, ft3Vol, lb3Vol, weight }
        })
      product.variants = variants
      // updates.push(Product.updateOne({ _id: product._id }, product))
    }
  }
  // await Promise.all(updates)
  console.log(withVariants)
  await closeDB()
})()