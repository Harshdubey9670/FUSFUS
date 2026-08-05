/**
 * Client-Side CDN Media Optimization Utility
 * Format dynamic CDN URLs for fast rendering and bandwidth optimization.
 */

export const getCdnUrl = (url, { width = 800, quality = 80, format = 'webp' } = {}) => {
  if (!url || typeof url !== 'string') return url;

  // Unsplash CDN
  if (url.includes('images.unsplash.com')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&q=${quality}&fm=${format}&fit=crop`;
  }

  // Cloudinary CDN
  if (url.includes('res.cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_${format},c_limit/`);
  }

  return url;
};
