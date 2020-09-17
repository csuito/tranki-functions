const { model, Schema } = require("mongoose")
const { addressSchema, venezuelanAddressSchema } = require("./address")

const productSchema = new Schema({
  asin: { type: String, required: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String, required: true },
  price: { type: String, required: true }
}, { _id: false })

const userSchema = new Schema({
  firebaseID: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  shippingAddresses: [addressSchema],
  viewedProducts: [productSchema],
  status: { type: String, required: true, default: "active" },
  lastLogin: { type: String, required: true, default: Date.now },
  creationDate: { type: String, required: true, default: Date.now },
  stripe: {
    id: { type: String },
    cards: [{
      last4: { type: String },
      brand: { type: String },
      id: { type: String },
      token: { type: String }
    }]
  }
})

userSchema.path("shippingAddresses").discriminator("Venezuela", venezuelanAddressSchema)

module.exports = model("User", userSchema)