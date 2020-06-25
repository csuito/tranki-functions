const { gql } = require("apollo-server-express")

module.exports = gql`
  type Product {
    asin: ID!
    title: String!
    sub_title: SubTitle
    brand: String
    weight: String
    shipping_weight: String
    dimensions: String
    link: String
    main_image: Media
    description: String
    price: Price
    rating: Float
    ratings_total: Int
    reviews_total: Int
    feature_bullets: [String]
    image: String
    images: [Media]
    categories: [Category]
    attributes: [Attribute]
    specifications: [Attribute]
    first_available: Date
    bestsellers_rank: [BestsellersRank]
    frequently_bought_together: [Product]
  }

  type SubTitle {
    title: String
    link: String
  }

  type Price {
    symbol: String
    value: Float
    currency: String
    raw: String
  }

  type Category {
    name: String
  }

  type Attribute {
    name: String
    value: String
  }

  type Media {
    link: String
  }

  type Date {
    raw: String
    utc: String
  }

  type BestsellersRank {
    category: String
    rank: Int
    link: String
  }
`