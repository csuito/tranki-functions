module.exports = `
  type Product {
    productID: ID!
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
    buybox_winner: BuyBoxWinner
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
    more_buying_choices: [BuyingChoice]
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

  type Variant {
    title: String
    asin: ID
    link: String
    price: Price
    buybox_winner: BuyBoxWinner
    image: String
    images: [Media]
    attributes: [Attribute]
  }

  type BuyBoxWinner {
    is_prime: Boolean
    condition: Condition
    availability: Availability
    fulfillment: Fulfillment
    price: Price
    rrp: Price
    shipping: Price
    save: Price
    unqualified_buy_box: Boolean
  }

  type Condition {
    is_new: Boolean
  }

  type Availability {
    type: String
    raw: String
    dispatch_days: Int
  }

  type Fulfillment {
    type: String
    is_sold_by_amazon: Boolean
    is_fulfilled_by_amazon:  Boolean
    is_sold_by_third_party: Boolean
    is_fulfilled_by_third_party: Boolean
  }

  type BuyingChoice {
    price: Price
    seller_name: String
    seller_link: String
    free_shipping: Boolean
    position: Int
  }

  type ProductShort {
    title: String
    asin: ID
    link: String
    price: Price
    image: String
    is_prime: Boolean
    rating: Float
    ratings_total: Int
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