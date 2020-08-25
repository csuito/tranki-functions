module.exports = {
  /**
   * Verifies jwt
   * @param args
   * @param ctx
   */
  isAuthenticated: async (_, args, { auth }) => {

    if (!auth) return new Error("Not authenticated")

    const app = require("../../../functions/config/firebase")
    const { skip } = require("graphql-resolvers")
    const { isAPIKey } = require('uuid-apikey')
    const Partner = require("../../model/partners")
    const DBQuery = require("../helpers/dbSession")

    if (isAPIKey(auth)) {
      try {
        const addCount = Partner.updateOne(
          { key: auth },
          { $inc: { count: 1 } }
        )
        await DBQuery(addCount)
        return skip
      } catch (e) {
        return new Error("Not authenticated")
      }
    } else {
      try {
        await app.auth().verifyIdToken(auth)
        return skip
      } catch (e) {
        return new Error("Not authenticated")
      }
    }

  },
}