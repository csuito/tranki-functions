// This model was generated by Lumber. However, you remain in control of your models.
// Learn how here: https://docs.forestadmin.com/documentation/v/v6/reference-guide/models/enrich-your-models
const { model, Schema } = require('mongoose');

const schema = new Schema({
  name: { type: String },
  active: { type: Boolean },
  image: { type: String }
})

module.exports = model('department', schema);
