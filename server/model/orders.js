const { model, Schema } = require("mongoose")
const { addressSchema, venezuelanAddressSchema } = require("./address")

const product = {
  id: { type: String, required: true },
  supplier: {
    name: { type: String },
    orderID: { type: String }
  },
  price: { type: String, required: true },
  qty: { type: Number, required: true },
  link: { type: String, required: true }
}

const total = {
  price: { type: Number },
  cost: { type: Number }
}

const shipping = new Schema({
  address: addressSchema,
  total,
  courier: { type: String, required: true },
  method: { type: String, required: true },
  weight: { type: String, required: true },
  eta: { type: String },
}, { _id: false })

shipping.path("address").discriminator("VEN", venezuelanAddressSchema)

const orderSchema = new Schema({
  cart: [product],
  userID: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  total,
  shipping,
  status: { type: String, required: true, default: "unfulfilled" },
  creationDate: { type: String, required: true, default: Date.now }
})

module.exports = model("Order", orderSchema)