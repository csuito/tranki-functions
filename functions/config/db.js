const mongoose = require("mongoose")
const db = mongoose.connection

const connectDB = () => {
  const options = {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    keepAlive: true,
    useFindAndModify: false,
    keepAliveInitialDelay: 300000,
    useUnifiedTopology: true,
    useCreateIndex: true
  }

  mongoose.connect(process.env.DB_URL, options)

  return new Promise(resolve => {
    db.once("open", () => {
      console.log("DB connected")
      resolve(db)
    })
  })
}

const closeDB = () => new Promise(resolve => {
  db.close(true, () => {
    console.log("DB connection closed")
    resolve(true)
  })
})

module.exports = {
  connectDB,
  closeDB
}