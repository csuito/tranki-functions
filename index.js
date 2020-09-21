module.exports = {
  api: require("./functions/graphqlServer"),
  webHook: require("./functions/webHook"),
  rest: require('./functions/rest'),
  push: require('./functions/expo-push')
}