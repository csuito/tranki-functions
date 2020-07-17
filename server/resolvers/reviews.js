const { combineResolvers } = require("graphql-resolvers")
const { isAuthenticated } = require("./middleware/auth")

/**
 * Returns review data for a single product
 * @param {*} args
 */
const getReviews = combineResolvers(
  isAuthenticated,
  async (_, { asin, sort_by, reviewer_type, review_stars, page = 1 }) => {
    const { client } = require("../../client")
    const { requestTypes, sortOptions: { reviews: sortOptions }, filters: { reviews: { stars, reviewerType } } } = require("../constants")

    const params = {
      type: requestTypes.REVIEWS,
      asin,
      page,
      sort_by: sort_by || sortOptions.MOST_RECENT,
      reviewer_type: reviewer_type || reviewerType.ALL,
      review_stars: review_stars || stars.ALL,
    }

    try {
      const { data: { product, summary, top_positive, top_critical, reviews, pagination } } = await client.get("/request", { params })
      return { product, summary, top_positive, top_critical, reviews, pagination }
    } catch (e) {
      return { success: false }
    }
  })

module.exports = getReviews