const { model, Schema } = require("mongoose")

const author = new Schema({
  name: { type: String },
  link: { type: String }
}, { _id: false })

const image = new Schema({
  link: { type: String },
  variant: { type: String }
}, { _id: false })

const summarization_attribute = new Schema({
  name: { type: String },
  value: { type: String },
  id: { type: String }
}, { _id: false })

const bestsellers_rank = new Schema({
  rank: { type: Number },
  category: { type: String },
  link: { type: String }
}, { _id: false })

const attribute = new Schema({
  name: { type: String },
  value: { type: String }
}, { _id: false })

const category = new Schema({
  name: { type: String }
}, { _id: false })

const price = new Schema({
  symbol: { type: String },
  value: { type: Number },
  currency: { type: String },
  raw: { type: String },
  name: { type: String }
}, { _id: false })

const shortProduct = new Schema({
  productID: { type: String },
  asin: { type: String },
  title: { type: String },
  image: { type: String },
  images: [image],
  specifications: [attribute],
  link: { type: String },
  main_image: {
    link: { type: String }
  },
  attributes: [attribute],
  description: { type: String },
  is_prime: { type: Boolean },
  rating: { type: Number },
  ratings_total: { type: Number },
  reviews_total: { type: Number },
  weight: { type: String },
  dimensions: [{
    name: { type: String },
    value: { type: String }
  }],
  shipping_weight: { type: String },
  buybox_winner: {
    is_prime: { type: Boolean },
    price,
    rrp: price,
    shipping: price,
    save: price
  },
  price
}, { _id: false })

const productSchema = new Schema({
  title: { type: String, required: true },
  productID: { type: String, required: true, unique: true, index: true },
  store: { type: String, required: true },
  link: { type: String, required: true },
  is_prime: { type: Boolean },
  image: { type: String },
  description: { type: String },
  bestseller: { type: Boolean },
  department: { type: String },
  category: { type: String },
  offer: { type: Boolean },
  authors: [author],
  format: { type: String },
  first_available: {
    raw: { type: String },
    utc: { type: String }
  },
  main_image: {
    link: { type: String }
  },
  images: [image],
  images_count: { type: Number },
  summarization_attributes: [summarization_attribute],
  bestsellers_rank: [bestsellers_rank],
  feature_bullets: [{ type: String }],
  sub_title: {
    text: { type: String },
    link: { type: String }
  },
  attributes: [attribute],
  specifications: [attribute],
  categories: [category],
  variants: [shortProduct],
  rating: { type: Number },
  ratings_total: { type: Number },
  reviews_total: { type: Number },
  brand: { type: String },
  weight: { type: String },
  dimensions: { type: String },
  shipping_weight: { type: String },
  buybox_winner: {
    is_prime: { type: Boolean },
    price,
    rrp: price,
    shipping: price,
    save: price
  },
  frequently_bought_together: {
    total_price: price,
    products: [shortProduct]
  },
  also_viewed: [shortProduct],
  also_bought: [shortProduct],
  ft3Vol: { type: Number, required: true },
  lb3Vol: { type: Number, required: true },
  weight: { type: Number, required: true },
  objectID: { type: String, required: true }
})

module.exports = model("product", productSchema)