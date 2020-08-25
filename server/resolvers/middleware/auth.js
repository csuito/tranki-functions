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

  /**
   * Verifies jwt and checks that request comes from resource owner
   * @param args
   * @param ctx
   */
  isOwner: async (_, { input: { firebaseID } }, { auth }) => {
    try {
      const { user_id } = await admin.auth().verifyIdToken(auth)
      if (user_id !== firebaseID) throw new Error("Unauthorized")
      return skip
    } catch (e) {
      return new Error("Unauthorized")
    }
  },

  /**
   * Verifies jwt and checks that request comes from an admin user
   * @param args
   * @param ctx
   */
  isAdmin: async (_, args, { auth }) => {
    try {
      const { roles } = await admin.auth().verifyIdToken(auth)
      if (!roles || !roles.includes("admin")) throw new Error("Unauthorized")
      return skip
    } catch (e) {
      return new Error("Unauthorized")
    }
  },

  /**
   * Verifies jwt and checks that request comes from order courier
   * @param args
   * @param ctx
   */
  isCourier: async (_, { input: { courierID } }, { auth }) => {
    try {
      const { user_id } = await admin.auth().verifyIdToken(auth)
      if (user_id !== courierID) throw new Error("Unauthorized")
      return skip
    } catch (e) {
      return new Error("Unauthorized")
    }
  },

}