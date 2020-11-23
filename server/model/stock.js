const { model, Schema } = require("mongoose")

const stockSchema = new Schema({
  stock_level: { type: Number },
  is_prime: { type: Boolean, required: true },
  in_stock: { type: Boolean, required: true },
  stock_failure: { type: Number, default: 0 },
  asin: { type: String, required: true, index: { unique: true } },
  lastChecked: { type: Date, default: Date.now }
})

module.exports = model("Stock", stockSchema)