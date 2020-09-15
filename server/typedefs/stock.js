module.exports = `
  type StockEstimation {
    asin: ID!
    stock_level: Int!
    price: Price
    is_prime: Boolean
    in_stock: Boolean!
    message: String
    min_quantity: Int
  }
`