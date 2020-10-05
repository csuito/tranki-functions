(async () => {

  require('dotenv').config()
  const algoliaClient = require("../config/algolia")()
  let allAlgoliaProducts = []

  try {
    const index = algoliaClient.initIndex("products")
    const callback = (hits) => {
      const products = hits.map(h => ({
        ...h,
        category: h.category.trim().toLowerCase(), department: h.department.trim().toLowerCase()
      }))
      allAlgoliaProducts = [...allAlgoliaProducts, ...products]
    }
    index.browseObjects({
      batch: callback,
      query: 'moda para ninos',
    }).then(async () => {
      const objectIDS = allAlgoliaProducts
        .filter(a => a.department === "moda para ninos")
        .map(a => a.objectID)
      await index.deleteObjects(objectIDS)
    }).catch(e => {
      console.log(e)
    })
  } catch (e) {
    console.log(e)
  }

})();