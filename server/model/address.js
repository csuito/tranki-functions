const { Schema } = require("mongoose")

const addressSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetType: { type: String, required: true }, // [calle, avenida]
  street: { type: String, required: true },
  houseOrAptNumber: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  location: {
    lat: { type: String },
    lon: { type: String }
  },
  additionalInfo: { type: String }
}, { discriminatorKey: "country" })

const venezuelanAddressSchema = new Schema({
  residence: { type: String },
  urbanization: { type: String, required: true },
  municipality: { type: String, required: true },
  pointOfReference: { type: String },
})

module.exports = {
  addressSchema,
  venezuelanAddressSchema
}