const axios = require("axios")

/**
 * Creates a custom axios instance
 */
class Client {
  constructor() {
    this.client = axios.create({
      baseURL: "https://api.rainforestapi.com",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json"
      },
    })
    this.setDefaultParams()
  }

  setDefaultParams() {
    this.client.interceptors.request.use(config => {
      config.params = config.params || {}
      config.params["amazon_domain"] = "amazon.com"
      config.params["api_key"] = process.env.RF_API_KEY
      config.params["output"] = "json"
      config.params["include_html"] = false
      config.params["offers_prime"] = true
      config.params["language"] = "es_US"
      return config
    })
  }
}

module.exports = new Client()