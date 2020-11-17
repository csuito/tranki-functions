(async () => {
  console.log("Hey!")
  require('dotenv').config()
  const User = require('../../server/model/users')
  const { connectDB, closeDB } = require('../config/db')
  try {
    await connectDB()
    let users = await User.find({}).lean()
    for (let user of users) {
      await User.updateOne({ _id: user._id }, { $set: { creationDate: new Date(parseInt(user.creationDate, 10)).toISOString(), lastLogin: new Date(parseInt(user.lastLogin, 10)).toISOString() } })
    }
    await closeDB()
  } catch (e) {
    console.log(e)
  }

})()