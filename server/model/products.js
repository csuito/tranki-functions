const { model, Schema } = require("mongoose")

const price = {
  symbol: { type: String },
  value: { type: Number },
  currency: { type: String },
  raw: { type: String },
  name: { type: String }
}

const productSchema = new Schema({
  asin: { type: String, required: true },
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