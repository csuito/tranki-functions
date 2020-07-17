module.exports = (() => {
  const admin = require("firebase-admin")
  if (!admin.apps.length) {
    return admin.initializeApp()
  }
})()