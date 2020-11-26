module.exports = {
  flatFeeDepartments: ["Ropa y Calzado"],
  requestTypes: {
    PRODUCT: "product",
    SEARCH: "search",
    STOCK_ESTIMATION: "stock_estimation",
    REVIEWS: "reviews",
    BESTSELLERS: "bestsellers",
    CATEGORY: "category"
  },
  sortOptions: {
    products: {
      MOST_RECENT: "most_recent",
      PRICE_LOW_TO_HIGH: "price_low_to_high",
      PRICE_HIGH_TO_LOW: "price_high_to_low",
      FEATURED: "featured",
      AVERAGE_REVIEW: "average_review",
    },

    reviews: {
      MOST_HELPFUL: "most_helpful",
      MOST_RECENT: "most_recent",
    }
  },
  AVG_SHOES_WEIGHT: 2.5,
  AVG_SHOES_FT3: 0.3240,
  AVG_SHOES_LB3: 3.3734,
  AVG_CLOTHING_WEIGHT: 1.32,
  AVG_CLOTHING_FT3: 0.2314,
  AVG_CLOTHING_LB3: 2.4096,
  filters: {
    reviews: {
      stars: {
        ALL: "all_stars",
        FIVE_STAR: "five_star",
        FOUR_STAR: "four_star",
        THREE_STAR: "three_star",
        TWO_STAR: "two_star",
        ONE_STAR: "one_star",
        POSITIVE: "all_positive",
        NEGATIVE: "all_critical",
      },

      reviewerType: {
        VERIFIED: "verified_purchase",
        ALL: "all",
      }
    }
  }
}