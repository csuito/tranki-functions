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