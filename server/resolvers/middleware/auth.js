module.exports = {
  /**
   * Verifies user jwt or partner's 
   * API key
   * @param req
   * @param res
   * @param next
   */
  isAuthenticatedRest: async (req, res, next) => {
    const { authorization } = req.headers
    if (!authorization) return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" })
    const app = require("../../../functions/config/firebase")
    const { isAPIKey } = require('uuid-apikey')
    const Partner = require("../../model/partners")
    const DBQuery = require("../helpers/dbSession")
    if (isAPIKey(authorization)) {
      try {
        const addCount = Partner.updateOne(
          { key: authorization },
          { $inc: { count: 1 } }
        )
        await DBQuery(addCount)
        return next()
      } catch (e) {
        return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" })
      }
    } else {
      try {
        await app.auth().verifyIdToken(authorization)
        return next()
      } catch (e) {
        return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" })
      }
    }
  },
  /**
   * Verifies jwt and checks that request comes from resource owner
   * @param req
   * @param res
   * @param next
   */
  isOwnerRest: async (req, res, next) => {
    const { authorization } = req.headers
    const { firebaseID } = req.body || req.params || req.query
    const app = require("../../../functions/config/firebase")
    try {
      const { user_id } = await app.auth().verifyIdToken(authorization)
      if (user_id !== firebaseID) return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" })
      return next()
    } catch (e) {
      return res.status(401).json({ message: "Unauthorized", error: "Unauthorized" })
    }
  },
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

  /**
   * Verifies jwt and checks that request comes from resource owner
   * @param args
   * @param ctx
   */
  isOwner: async (_, { input: { firebaseID } }, { auth }) => {
    const app = require("../../../functions/config/firebase")
    const { skip } = require("graphql-resolvers")
    try {
      const { user_id } = await app.auth().verifyIdToken(auth)
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
    const app = require("../../../functions/config/firebase")
    const { skip } = require("graphql-resolvers")
    try {
      const { roles } = await app.auth().verifyIdToken(auth)
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
    const app = require("../../../functions/config/firebase")
    const { skip } = require("graphql-resolvers")
    try {
      const { user_id } = await app.auth().verifyIdToken(auth)
      if (user_id !== courierID) throw new Error("Unauthorized")
      return skip
    } catch (e) {
      return new Error("Unauthorized")
    }
  },
}