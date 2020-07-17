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

  if (db.readyState === 0) {
    return new Promise(resolve => {
      db.once("open", () => {
        console.log("DB connected")
        resolve(db)
      })
    })
  } else {
    return db
  }
}

const closeDB = () => {
  if (db.readyState === 1) {
    return new Promise(resolve => {
      db.close(true, () => {
        console.log("Closing DB connection")
        resolve(true)
      })
    })
  }
}

module.exports = {
  connectDB,
  closeDB
}