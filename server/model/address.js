const { Schema } = require("mongoose")

const addressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetType: { type: String, required: true },
  street: { type: String, required: true },
  houseOrAptNumber: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postCode: { type: String },
  additionalInfo: { type: String }
}, { discriminatorKey: "country" })

const venezuelanAddressSchema = new Schema({
  residence: { type: String },
  urbanization: { type: String },
  municipality: { type: String, required: true },
})

module.exports = {
  addressSchema,
  venezuelanAddressSchema
}