const algoliaConfig = () => {
  const algoliasearch = require("algoliasearch")
  return algoliasearch(process.env.ALGOLIA_CLIENT_ID, process.env.ALGOLIA_CLIENT_SECRET)
}

module.exports = algoliaConfig