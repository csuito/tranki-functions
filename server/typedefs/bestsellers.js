module.exports = `
  type Bestseller {
    rank: Int
    position: Int
    title: String
    sub_title: SubTitle
    variant: String
    asin: String
    link: String
    image: String
    rating: Float
    ratings_total: Int
    price: Price
    price_lower: Price
    price_upper: Price
  }

  type Bestsellers {
    bestsellers: [Bestseller]
    pagination: Pagination
  }
`