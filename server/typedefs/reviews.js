const { gql } = require("apollo-server-express")

module.exports = gql`
  type RatingBreakdown {
    percentage: Int
    count: Int
  }

  type Breakdown {
    five_star: RatingBreakdown
    four_star: RatingBreakdown
    three_star: RatingBreakdown
    two_star: RatingBreakdown
    one_star: RatingBreakdown
  }

  type Summary {
    rating: Float
    ratings_total: Int
    reviews_total: Int
    reviews_positive: Int
    reviews_critical: Int
    rating_breakdown: Breakdown
  }

  type Review {
    id: ID!
    title: String
    body: String
    link: String
    rating: Int
    date: Date
    verified_purchase: Boolean
    attributes: [Attribute]
    images: [Media]
    helpful_votes: Int
    comments: Int
  }

  extend type Pagination {
    start: Int
    end: Int
    reviews_total: Int
  }

  type ReviewsResult {
    product: Product
    summary: Summary
    top_positive: Review
    top_critical: Review
    reviews: [Review]
    pagination: Pagination
  }
`