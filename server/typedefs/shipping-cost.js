module.exports = `
  type ShippingCost {
    air: Float!
    sea: Float!
    in_stock: [String!]!
    price_changed: Boolean!
    airCost: Float!
    seaCost: Float!
    dimensions: Float!
    weight: Float!
    volumetric_weight: Float!
    airFee: Float!
    seaFee: Float!
    totalProductsPrice: Float!
    totalAirFee: Float!
    totalSeaFee: Float!
  }
`