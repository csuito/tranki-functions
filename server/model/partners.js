const { model, Schema } = require("mongoose")

const partnerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: { unique: true } },
  uuid: { type: String, required: true },
  key: { type: String, required: true, index: true },
  count: { type: Number, default: 0 }
})

module.exports = model("partner", partnerSchema)