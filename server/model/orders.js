const { model, Schema } = require("mongoose")
const { addressSchema, venezuelanAddressSchema } = require("./address")

const product = {
  productID: { type: String, required: true },
  supplier: {
    name: { type: String, required: true },
    supplierOrderID: { type: String }
  },
  status: { type: String, required: true, default: "waiting" },
  title: { type: String, required: true },
  price: { type: String, required: true },
  image: { type: String, required: true },
  qty: { type: Number, required: true },
  link: { type: String, required: true },
  variant: { type: String }
}

const total = {
  price: { type: Number, required: true },
  cost: { type: Number }
}

const payment = {
  txID: { type: String, required: true },
  method: { type: String, required: true },
  brand: { type: String, required: true },
  last4: { type: String, required: true },
  fee: { type: Number, required: true },
}

const timelineObject = {
  status: { type: String, required: true, default: "unfulfilled" },
  date: { type: Date, required: true, default: Date.now }
}

const shipping = new Schema({
  address: addressSchema,
  total,
  courier: { type: String, required: true },
  method: { type: String, required: true },
  weight: { type: String },
  dimensions: { type: String },
  courier_weight: { type: String },
  courier_dimensions: { type: String },
  eta: { type: String },
  timeline: [timelineObject]
}, { _id: false })

shipping.path("address").discriminator("Venezuela", venezuelanAddressSchema)

const orderSchema = new Schema({
  cart: [product],
  userID: { type: String, required: true },
  locator: { type: String, index: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  price: { type: Number, required: true },
  cost: { type: Number },
  weight: { type: Number },
  dimensions: { type: Number },
  payment,
  shipping,
  status: { type: String, required: true, default: "unfulfilled" },
  creationDate: { type: Date, required: true, default: Date.now },
  updatedOn: { type: Date, required: true, default: Date.now }
})

orderSchema.pre('save', function (next) {
  if (!this.locator)
    this.locator = `${this._id}`.substr(-5)
  next()
})

module.exports = model("Order", orderSchema)