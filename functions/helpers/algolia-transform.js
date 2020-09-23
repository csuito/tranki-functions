module.exports = (product, department, category) => {
  if (product.objectID) {
    return {
      objectID: product.objectID,
      productID: product.productID,
      store: product.store,
      specifications: product.specifications,
      title: product.title,
      department: product.department.trim().toLowerCase(),
      category: product.category.trim().toLowerCase(),
      bestseller: product.bestseller,
      buybox_winner: product.buybox_winner,
      parent_asin: product.parent_asin,
      link: product.link,
      brand: product.brand,
      description: product.description,
      rating: product.rating,
      ratings_total: product.ratings_total,
      main_image: product.main_image,
      images: product.images,
      videos: product.videos,
      images_count: product.images_count,
      feature_bullets: product.feature_bullets,
      has_variants: product.variants && product.variants.length > 0,
      frequently_bought_together: product.frequently_bought_together,
      ft3Vol: product.ft3Vol,
      lb3Vol: product.lb3Vol,
      weight: product.weight
    }
  } else {
    return {
      productID: product.productID,
      store: product.store,
      specifications: product.specifications,
      title: product.title,
      department: department.trim().toLowerCase(),
      category: category.trim().toLowerCase(),
      bestseller: product.bestseller,
      buybox_winner: product.buybox_winner,
      parent_asin: product.parent_asin,
      link: product.link,
      brand: product.brand,
      description: product.description,
      rating: product.rating,
      ratings_total: product.ratings_total,
      main_image: product.main_image,
      images: product.images,
      videos: product.videos,
      images_count: product.images_count,
      has_variants: product.variants && product.variants.length > 0,
      feature_bullets: product.feature_bullets,
      frequently_bought_together: product.frequently_bought_together,
      ft3Vol: product.ft3Vol,
      lb3Vol: product.lb3Vol,
      weight: product.weight
    }
  }
}