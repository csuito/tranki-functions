const { model, Schema } = require("mongoose")

const partnerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, index: { unique: true } },
  uuid: { type: String, required: true },
  key: { type: String, required: true, index: true },
  timeline: [{
    count: { type: Number, default: 0 },
    month: { type: String, required: true },
    year: { type: String, required: true }
  }]
})

partnerSchema.statics.increaseAPICount = async function (auth) {
  const dayjs = require('dayjs')
  const currentMonth = dayjs().month()
  const currentYear = dayjs().year()
  try {
    await this.bulkWrite([
      {
        "updateOne": {
          "filter": { "key": auth, "timeline.month": currentMonth, "timeline.year": currentYear },
          "update": {
            "$inc": {
              "timeline.$.count": 1
            }
          }
        }
      },
      {
        "updateOne": {
          "filter": { "key": auth, "timeline.month": { "$ne": currentMonth }, "timeline.year": currentYear },
          "update": {
            "$addToSet": { "timeline": { "month": currentMonth, "year": currentYear, "count": 1 } }
          }
        }
      },
      {
        "updateOne": {
          "filter": { "key": auth, "timeline.year": { "$ne": currentYear } },
          "update": {
            "$addToSet": { "timeline": { "month": currentMonth, "year": currentYear, "count": 1 } }
          }
        }
      }
    ])
  } catch (e) {
    console.error("Error", e)
    throw new Error(e)
  }

}

module.exports = model("partner", partnerSchema)