const app = require("express")()
const { https: { onRequest } } = require("firebase-functions")

const { ApolloServer, makeExecutableSchema } = require("apollo-server-express")
const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  resolverValidationOptions: { requireResolversForResolveType: false },
})

const server = new ApolloServer({ schema, introspection: true, playground: true })

server.applyMiddleware({
  app,
  path: "/",
  cors: {
    origin: "*",
    credentials: false
  },
})

module.exports = onRequest(app)