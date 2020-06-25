const { client } = require("../../client")
const { requestTypes, sortOptions: { reviews: sortOptions }, filters: { reviews: { stars, reviewerType } } } = require("../constants")

/**
 * Returns review data for a single product
 * @param {*} args
 */
const getReviews = async (_, { asin, sort_by = sortOptions.MOST_RECENT, reviewer_type = reviewerType.ALL, review_stars = stars.ALL, page = 1 }) => {
  const params = {
    type: requestTypes.REVIEWS,
    asin,
    page,
    sort_by,
    reviewer_type,
    review_stars,
  }

  try {
    const { data: { product, summary, top_positive, top_critical, reviews, pagination } } = await client.get("/", { params })
    return { product, summary, top_positive, top_critical, reviews, pagination }
  } catch (e) {
    return e
  }
}

module.exports = getReviews