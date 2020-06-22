const app = require("express")()
const { ApolloServer, gql } = require("apollo-server-express")

const typeDefs = gql`
  type Query {
    hello: String
  }
`
const resolvers = {
  Query: {
    hello: () => 'Hello World!'
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.applyMiddleware({
  app,
  path: '/',
  cors: {
    origin: '*',
    credentials: false
  },
  playground: true
})

app.listen(8080, () => {
  console.log(`🚀 Server ready at http://localhost:8080${server.graphqlPath}`)
})

// gcloud export
//exports.api = server