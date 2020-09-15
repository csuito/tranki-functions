module.exports = async (req, res) => {
  console.log("Body: ", JSON.stringify(req.body))

  if (!req.query || !req.query.category || !req.query.department) {
    throw new Error("No department or category specified")
  }

  if (process.env.NODE_ENV === "local") {
    require("dotenv").config()
  }

  const { connectDB, closeDB } = require("./config/db")

  try {
    await connectDB()
  } catch (err) {
    throw new Error("Unable to connect DB")
  }

  try {

    if (!req.body.result_set || !req.body.result_set.download_links) {
      throw new Error("No downloadable links")
    }

    const { getDownloadLinks, getPrimeProductCodes, getProductDetails, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray, getShippingInfo, getSpec } = require("./helpers/hookHelpers")

    const { result_set: { download_links: { json: { pages } } } } = req.body

    const downloadLinks = getDownloadLinks(pages)

    console.log("Download links retrieved - ready to get products", `${downloadLinks && downloadLinks.length ? downloadLinks.length : 0}`)

    const results = await Promise.all(downloadLinks)

    console.log("Retrieved products - ready for preprocessing", `${results && results.length ? results.length : 0}`)

    let productCodes = getPrimeProductCodes(results)

    // productCodes = [productCodes[90], productCodes[95]]

    console.log(`Results preprocessing done - ready to get ${productCodes && productCodes.length ? productCodes.length : 0} product details`)

    let products = await getProductDetails(productCodes, req.query)
    products = products
      .filter(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        return weightSpec && dimensionSpec
      })
      .map(p => {
        const { weightSpec, dimensionSpec } = getSpec(p)
        const { ft3Vol, weight, lb3Vol } = getShippingInfo(weightSpec, dimensionSpec, 1)
        return { ...p, ft3Vol, lb3Vol, weight }
      })

    console.log(`Products: ${products && products.length > 0 ? products.length : 0}`)

    const { existingProducts, newProducts } = await splitProductsByOpType(products)

    console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: (existingProducts.length + newProducts.length) })

    if (checkArray(existingProducts) || checkArray(newProducts)) {
      const algoliaClient = require("./config/algolia")()
      const index = algoliaClient.initIndex("products")
      const algoliaProducts = existingProducts.map(p => ({
        objectID: p.objectID,
        specifications: p.specifications,
        title: p.title,
        department: req.query.department,
        category: req.query.category,
        bestseller: p.bestseller,
        buybox_winner: p.buybox_winner,
        productID: p.asin,
        parent_asin: p.parent_asin,
        link: p.link,
        brand: p.brand,
        description: p.description,
        rating: p.rating,
        ratings_total: p.ratings_total,
        main_image: p.main_image,
        images: p.images,
        images_count: p.images_count,
        feature_bullets: p.feature_bullets,
        has_variants: p.variants && p.variants.length > 0,
        frequently_bought_together: p.frequently_bought_together,
        ft3Vol: p.ft3Vol,
        lb3Vol: p.lb3Vol,
        weight: p.weight
      }))
      let updates = []
      if (checkArray(existingProducts)) {
        await index.saveObjects(algoliaProducts, {
          autoGenerateObjectIDIfNotExist: true
        })

        console.log(`Updated ${existingProducts.length} products in Algolia`)

        updates = buildUpdateOps(existingProducts)
      }

      let inserts = []
      if (checkArray(newProducts)) {
        const algoliaProducts = newProducts.map(p => ({
          productID: p.asin,
          specifications: p.specifications,
          title: p.title,
          department: req.query.department,
          category: req.query.category,
          bestseller: p.bestseller,
          buybox_winner: p.buybox_winner,
          parent_asin: p.parent_asin,
          link: p.link,
          brand: p.brand,
          description: p.description,
          rating: p.rating,
          ratings_total: p.ratings_total,
          main_image: p.main_image,
          images: p.images,
          images_count: p.images_count,
          has_variants: p.variants && p.variants.length > 0,
          feature_bullets: p.feature_bullets,
          frequently_bought_together: p.frequently_bought_together,
          ft3Vol: p.ft3Vol,
          lb3Vol: p.lb3Vol,
          weight: p.weight
        }))
        const { objectIDs } = await index.saveObjects(algoliaProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        console.log(`Saved ${objectIDs.length} new products in Algolia`)
        const newUniqueProducts = [...new Map(
          newProducts.map
            (item => [item['asin'], item])).values()
        ].map(p => ({ ...p, productID: p.asin, store: "Amazon" }))
        inserts = buildInsertOps(newUniqueProducts, objectIDs)
      }

      const Product = require("../server/model/products")
      console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })
      const allProducts = [...updates, ...inserts]
      await Product.bulkWrite(allProducts)
      console.log("Saved products in DB")
    }
    await closeDB()
    return res.status(200).send()
  } catch (err) {
    console.log(err)
    await closeDB()

    return res.status(500).send()
  }
}