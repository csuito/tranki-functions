(async () => {
  require('dotenv').config()
  const DBQuery = require('../../server/resolvers/helpers/dbSession')
  const Product = require('../../server/model/products')
  const algoliaClient = require("../config/algolia")()
  const index = algoliaClient.initIndex("products")
  let products = await DBQuery(Product.find({}))
  let allAlgoliaProducts = []
  let willGetRemoved = []

  const callback = (hits) => {
    allAlgoliaProducts = [...allAlgoliaProducts, ...hits]
  }

  index.browseObjects({
    batch: callback
  }).then(async () => {
    console.log("Batch done!")
    for (let algoProduct of allAlgoliaProducts) {
      const existingProduct = products.find(p => p.objectID === algoProduct.objectID)
      if (!existingProduct) {
        willGetRemoved.push(algoProduct.objectID)
      }
    }
    index.deleteObjects(willGetRemoved).then(({ objectIDs }) => {
      console.log(objectIDs);
    })



    // for (let algoProduct of allAlgoliaProducts) {

    //   const existingProduct = products.find(p => p.productID === algoProduct.productID)
    //   if (!existingProduct) {
    //     willGetRemoved.push(algoProduct.objectID)
    //   }
    // }
    // console.log({ willGetRemoved: willGetRemoved.length })


    // console.log(willGetRemoved.length)

    // await Promise.all(willGetRemoved)

    // console.log("Will remove: ", willGetRemoved)

    // for (let algoProduct of allAlgoliaProducts) {
    //   const productExists = products.some(p => p.productID === algoProduct.productID)
    //   if (!productExists) {
    //     willGetRemoved.push(algoProduct)
    //   }
    // }
    // console.log("Will remove: ", willGetRemoved.length)
  })

  // const products = await DBQuery(Product.deleteMany({ category: "Comidas preparadas" }))
  // const objectIDS = products.map(p => p.objectID)
  // try {
  //   const response = await index.deleteObjects(objectIDS)
  //   console.log({ response })
  // } catch (err) {
  //   console.log(err)
  // }


})();