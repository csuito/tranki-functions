if (process.env.NODE_ENV === "local") {
  require("dotenv").config({ path: "/Users/henry/dev/Tranki/Functions/.env" })
}

const app = require("express")()

const { https: { onRequest } } = require("firebase-functions")
const { ApolloServer } = require("apollo-server-express")
const { makeExecutableSchema } = require('graphql-tools')
const { constraintDirective, constraintDirectiveTypeDefs } = require('graphql-constraint-directive')
const typeDefs = require("../server/typedefs")
const resolvers = require("../server/resolvers")

const schema = makeExecutableSchema({
  typeDefs: [constraintDirectiveTypeDefs, typeDefs],
  schemaTransforms: [constraintDirective()],
  resolvers,
  resolverValidationOptions: { requireResolversForResolveType: false },
})

const server = new ApolloServer({
  schema,
  introspection: true,
  playground: true,
  context: ({ req }) => ({
    auth: req.headers.authorization || ""
  })
})

server.applyMiddleware({
  app,
  path: "/",
  cors: {
    origin: "*",
    credentials: false
  },
})

module.exports = onRequest(app)