module.exports = {
  api: require("./functions/graphqlServer"),
  webHook: require("./functions/webHook"),
  rest: require('./functions/rest')
}