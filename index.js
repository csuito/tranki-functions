exports.api = (() => {
  const app = require("express")()
  const { https: { onRequest } } = require("firebase-functions")

  const { ApolloServer } = require("apollo-server-express")
  const typeDefs = require("./server/typedefs")
  const resolvers = require("./server/resolvers")

  const server = new ApolloServer({ typeDefs, resolvers, introspection: true, playground: true })

  server.applyMiddleware({
    app,
    path: "/",
    cors: {
      origin: "*",
      credentials: false
    },
  })

  return onRequest(app)
})()