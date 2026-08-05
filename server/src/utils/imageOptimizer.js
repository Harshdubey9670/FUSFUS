/**
 * CDN Image & Media Optimization Helper
 * Appends WebP format parameters, dynamic width scaling, and quality compression.
 */

exports.getOptimizedImageUrl = (url, width = 800, quality = 80) => {
  if (!url || typeof url !== 'string') return url;

  // Unsplash dynamic optimization
  if (url.includes('images.unsplash.com')) {
    const hasParams = url.includes('?');
    const paramChar = hasParams ? '&' : '?';
    return `${url}${paramChar}w=${width}&q=${quality}&fm=webp&fit=crop`;
  }

  // Cloudinary dynamic optimization
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_webp,c_limit/`);
  }

  return url;
};

// Express Header Middleware for Static Assets & CDN Caching
exports.cdnCacheHeaderMiddleware = (maxAgeSeconds = 86400) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds * 7}, stale-while-revalidate=3600`);
    next();
  };
};
