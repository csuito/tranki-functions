module.exports = {
  /**
   * Verifies jwt
   * @param args
   * @param ctx
   */
  isAuthenticated: async (_, args, { auth }) => {
    const app = require("../../../functions/config/firebase")
    const { skip } = require("graphql-resolvers")

    try {
      await app.auth().verifyIdToken(auth)
      return skip
    } catch (e) {
      return new Error("Not authenticated")
    }
  },
}