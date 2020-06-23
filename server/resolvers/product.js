const { default: client } = require("axios")

module.exports = async (_, args) => {
  const params = {
    api_key: process.env.RF_API_KEY,
    amazon_domain: "amazon.com",
    type: "product",
    asin: args.asin
  }

  try {
    const uri = "https://api.rainforestapi.com/request"
    const { data: { product } } = await client.get(uri, { params })
    return product
  } catch (e) {
    return e
  }
}