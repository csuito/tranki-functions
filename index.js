require("dotenv").config()

const app = require("express")()

const { ApolloServer } = require("apollo-server-express")
const typeDefs = require("./server/typedefs")
const resolvers = require("./server/resolvers")

const server = new ApolloServer({ typeDefs, resolvers })

server.applyMiddleware({
  app,
  path: "/",
  cors: {
    origin: "*",
    credentials: false
  },
  playground: true
})

app.listen(8080, () => {
  console.log(`🚀 Server ready at http://localhost:8080${server.graphqlPath}`)
})

// gcloud export
// exports.api = server