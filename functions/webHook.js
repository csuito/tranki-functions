module.exports = async (req, res) => {
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

    const { getDownloadLinks, getPrimeProductCodes, getProductDetails, splitProductsByOpType, buildInsertOps, buildUpdateOps, checkArray } = require("./helpers/hookHelpers")

    const { result_set: { download_links: { json: { pages } } } } = req.body

    const downloadLinks = getDownloadLinks(pages)

    console.log("Download links retrieved - ready to get products", `${downloadLinks && downloadLinks.length ? downloadLinks.length : 0}`)

    const results = await Promise.all(downloadLinks)

    console.log("Retrieved products - ready for preprocessing", `${results && results.length ? results.length : 0}`)

    const productCodes = getPrimeProductCodes(results)

    console.log(`Results preprocessing done - ready to get ${productCodes && productCodes.length ? productCodes.length : 0} product details`)

    const products = await getProductDetails(productCodes, req.query)

    console.log(`Products: ${products && products.length > 0 ? products.length : 0}`)

    const { existingProducts, newProducts } = await splitProductsByOpType(products)

    console.log("Products breakdown:", { existingProducts: existingProducts.length, newProducts: newProducts.length, totalProducts: (existingProducts.length + newProducts.length) })

    if (checkArray(existingProducts) || checkArray(newProducts)) {
      const algoliaClient = require("./config/algolia")()
      const index = algoliaClient.initIndex("products")
      const algoliaProducts = existingProducts.map(p => ({
        objectID: p.objectID,
        asin: p.asin,
        specifications: p.specifications,
        title: p.title,
        department: p.department,
        bestseller: p.bestseller,
        buybox_winner: p.buybox_winner,
        asin: p.asin,
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
        frequently_bought_together: p.frequently_bought_together
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
          asin: p.asin,
          specifications: p.specifications,
          title: p.title,
          department: p.department,
          bestseller: p.bestseller,
          buybox_winner: p.buybox_winner,
          asin: p.asin,
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
          frequently_bought_together: p.frequently_bought_together
        }))
        const { objectIDs } = await index.saveObjects(algoliaProducts, {
          autoGenerateObjectIDIfNotExist: true
        })
        console.log(`Saved ${objectIDs.length} new products in Algolia`)
        const newUniqueProducts = [...new Map(
          newProducts.map
            (item => [item['asin'], item])).values()
        ]
        inserts = buildInsertOps(newUniqueProducts, objectIDs)
      }

      const Product = require("../server/model/products")
      console.log("Ready to execute DB operations:", { inserts: inserts.length, updates: updates.length, totalOperations: updates.length + inserts.length })

      await Product.bulkWrite([...updates, ...inserts])
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