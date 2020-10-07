(async () => {

  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  let allAlgoliaProducts = []

  try {
    const index = algoliaClient.initIndex("products")
    const callback = (hits) => {
      allAlgoliaProducts = [...allAlgoliaProducts, ...hits]
    }
    index.browseObjects({
      batch: callback,
      query: '',
      filters: "category:'telefonos celulares'"
    }).then(async () => {
      const objectIDS = allAlgoliaProducts
        .map(a => a.objectID)
      // await index.deleteObjects(objectIDS)
    }).catch(e => {
      console.log(e)
    })
  } catch (e) {
    console.log(e)
  }

})();