const { model, Schema } = require("mongoose")

const price = {
  symbol: { type: String, required: true, default: "US$" },
  value: { type: Number, required: true },
  currency: { type: String, required: true, default: "USD" },
  raw: { type: String },
  name: { type: String }
}

const productSchema = new Schema({
  asin: { type: String, required: true, unique: true, index: true },
  objectID: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  link: { type: String, required: true },
  image: { type: String, required: true },
  bestseller: { type: Boolean, required: true, default: false },
  offer: { type: Boolean, required: true, default: false },
  department: { type: String, required: true, default: "all" },
  category: { type: String, required: true, default: "all" },
  prices: [price]
})

module.exports = model("Product", productSchema)