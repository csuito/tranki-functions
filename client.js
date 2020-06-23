const axios = require("axios")

/**
 * Creates a custom axios instance
 */
class Client {
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.rainforestapi.com/request",
      timeot: 10000,
      headers: {
        "Content-Type": "application/json"
      },
    })
    this.setDefaultParams()
    this.setRequestTypes()
  }

  setDefaultParams() {
    this.client.interceptors.request.use(config => {
      config.params = config.params || {}
      config.params["amazon_domain"] = "amazon.com"
      config.params["api_key"] = process.env.RF_API_KEY
      config.params["output"] = "json"
      config.params["include_html"] = false
      return config
    })
  }

  setRequestTypes() {
    this.requestTypes = {
      PRODUCT: "product",
      SEARCH: "search",
      STOCK_ESTIMATION: "stock_estimation",
      REVIEWS: "reviews",
      OFFERS: "offers",
      BESTSELLERS: "bestsellers",
      CATEGORY: "category"
    }
  }
}

module.exports = new Client()