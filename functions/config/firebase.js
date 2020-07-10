module.exports = (() => {
  const admin = require("firebase-admin")
  return admin.initializeApp()
})()