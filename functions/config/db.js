const dbConfig = () => {
  const mongoose = require("mongoose")

  const db = mongoose.connection
  if (db.readyState === 0) {
    mongoose.connect(process.env.DB_URL, {
      dbName: process.env.DB_NAME, useNewUrlParser: true, keepAlive: true, useFindAndModify: false,
      keepAliveInitialDelay: 300000, useUnifiedTopology: true, useCreateIndex: true
    }, error => {
      if (error) throw new Error("Unable to connect to DB")
      else console.log("DB connected")
    })
  }
  return db
}

module.exports = dbConfig