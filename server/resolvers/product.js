const { client } = require("../../client")
const { requestTypes } = require("../constants")

/**
 * Retrieves a product by id
 * @param {*} asin - amazon product id
 */
const getProduct = async (_, { asin }) => {
  const params = {
    type: requestTypes.PRODUCT,
    asin
  }

  try {
    const { data: { product } } = await client.get("/", { params })
    return product
  } catch (e) {
    return e
  }
}

module.exports = getProduct