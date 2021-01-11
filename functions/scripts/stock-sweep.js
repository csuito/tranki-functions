require('dotenv').config()
const Products = require('../../server/model/products')
const fs = require('fs')
const backup = require('../backups/products.json')
const { requestTypes } = require('../../server/constants')
const { client } = require('../../client')
const { splitUp } = require('../helpers/hookHelpers')
const AllSettled = require('promise.allsettled')
const algolia = require('../config/algolia')()
const index = algolia.initIndex('products')

const waitFor = async (ms) => {
    return new Promise((res) => {
        setTimeout(() => res(), ms)
    })
}

const StockSweep = async () => {
    const numBatches = Math.ceil(backup.length / 10)
    const batches = splitUp(backup, numBatches)
    let allAlgoliaIDs = []
    for (let batch of batches) {
        await waitFor(2000)
        const promises = batch.map(b => client.get('/request', {
            params: { type: requestTypes.STOCK_ESTIMATION, asin: b.productID },
            timeout: 600000
        }))
        const responses = await AllSettled(promises)
        const estimations = responses
            .filter(product => product.status === "fulfilled" && product.value.data.stock_estimation)
            .map(product => product.value.data.stock_estimation)
        const shouldDelete = batch.filter(b => {
            const estimation = estimations.find(estimation => estimation.asin === b.productID)
            return !estimation || !estimation.in_stock ? true : false
        })
        const productIDs = shouldDelete.map(product => product.productID)
        const objIDs = shouldDelete.map(product => product.objectID)
        allAlgoliaIDs = [...allAlgoliaIDs, ...objIDs]
        fs.writeFile('./functions/backups/algolia-backup.json', JSON.stringify(allAlgoliaIDs), (err) => { if (err) console.error(err) })
        console.log("Removing", { db: productIDs, algolia: objIDs })
        // if (productIDs && productIDs.length && objIDs && objIDs.length) {
        //     await Products.deleteMany({ productID: { $in: productIDs } })
        //     await index.deleteObjects(objIDs)
        // }
    }

    return true
}

(async () => {
    await StockSweep()
})();
