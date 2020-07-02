const { gql } = require("apollo-server-express")

module.exports = gql`
  type Product {
    asin: ID!
    title: String
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
    variants: [Variant]
    attributes: [Attribute]
    specifications: [Attribute]
    first_available: Date
    bestsellers_rank: [BestsellersRank]
    also_viewed: [ProductShort]
    also_bought: [ProductShort]
    sponsored_products: [ProductShort]
    frequently_bought_together: [Product]
  }

  type SubTitle {
    text: String
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

  type ProductShort implements Variant {
    title: String
    asin: ID
    link: String
    price: Price
    image: String
    is_prime: Boolean
    rating: Float
    ratings_total: Int
  }

  interface Variant {
    title: String
    asin: ID
    link: String
    price: Price
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