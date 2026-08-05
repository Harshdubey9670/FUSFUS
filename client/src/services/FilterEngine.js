/**
 * InstaSnap GPU & Canvas Filter Engine
 * Module 2: Photo Filter Engine Architecture
 * Supports 30 preset filters + dynamic custom filter registration
 */

export const EXTENDED_FILTER_PRESETS = [
  { id: 'natural', name: 'Natural', category: 'Basic', css: 'none' },
  { id: 'bright', name: 'Bright', category: 'Basic', css: 'brightness(115%) contrast(105%) saturate(105%)' },
  { id: 'warm', name: 'Warm', category: 'Tone', css: 'sepia(25%) brightness(105%) saturate(120%)' },
  { id: 'cool', name: 'Cool', category: 'Tone', css: 'hue-rotate(15deg) contrast(105%) saturate(110%)' },
  { id: 'vintage', name: 'Vintage', category: 'Retro', css: 'sepia(45%) hue-rotate(-15deg) contrast(110%)' },
  { id: 'retro', name: 'Retro 80s', category: 'Retro', css: 'saturate(160%) hue-rotate(-20deg) contrast(120%)' },
  { id: 'bw', name: 'Black & White', category: 'Monochrome', css: 'grayscale(100%) contrast(120%)' },
  { id: 'noir', name: 'Noir Film', category: 'Monochrome', css: 'grayscale(100%) contrast(180%) brightness(95%)' },
  { id: 'sepia', name: 'Classic Sepia', category: 'Retro', css: 'sepia(80%) contrast(105%)' },
  { id: 'fade', name: 'Matte Fade', category: 'Style', css: 'contrast(85%) brightness(110%) saturate(85%)' },
  { id: 'film', name: 'Analogue Film', category: 'Style', css: 'contrast(115%) saturate(130%) sepia(15%)' },
  { id: 'cinema', name: 'Cinema 35mm', category: 'Style', css: 'contrast(125%) hue-rotate(-10deg) saturate(120%)' },
  { id: 'portrait', name: 'Soft Portrait', category: 'Beauty', css: 'brightness(108%) contrast(95%) saturate(105%)' },
  { id: 'soft', name: 'Soft Glow', category: 'Beauty', css: 'brightness(110%) contrast(90%) blur(0.3px)' },
  { id: 'sharp', name: 'Ultra Sharp', category: 'Enhance', css: 'contrast(130%) saturate(120%)' },
  { id: 'hdr', name: 'HDR Max', category: 'Enhance', css: 'contrast(140%) saturate(150%) brightness(105%)' },
  { id: 'glow', name: 'Neon Glow', category: 'Creative', css: 'drop-shadow(0 0 10px rgba(255,0,225,0.6)) contrast(130%)' },
  { id: 'dream', name: 'Dreamy', category: 'Creative', css: 'brightness(115%) saturate(140%) hue-rotate(5deg)' },
  { id: 'matte', name: 'Velvet Matte', category: 'Style', css: 'contrast(90%) brightness(105%) saturate(90%)' },
  { id: 'moody', name: 'Moody Dark', category: 'Style', css: 'contrast(135%) brightness(85%) saturate(125%)' },
  { id: 'vivid', name: 'Vivid Pop', category: 'Color', css: 'saturate(200%) contrast(115%)' },
  { id: 'pastel', name: 'Pastel Pop', category: 'Color', css: 'brightness(115%) saturate(140%) contrast(85%)' },
  { id: 'night', name: 'Night Sight', category: 'Special', css: 'brightness(135%) contrast(110%) saturate(120%)' },
  { id: 'sunset', name: 'Sunset Sunburst', category: 'Nature', css: 'sepia(40%) saturate(170%) contrast(115%)' },
  { id: 'golden', name: 'Golden Hour', category: 'Nature', css: 'sepia(50%) contrast(110%) saturate(160%)' },
  { id: 'food', name: 'Foodie Pop', category: 'Special', css: 'saturate(180%) contrast(120%) brightness(105%)' },
  { id: 'landscape', name: 'Vivid Nature', category: 'Nature', css: 'saturate(160%) contrast(125%) hue-rotate(-5deg)' },
  { id: 'travel', name: 'Wanderlust', category: 'Nature', css: 'contrast(115%) saturate(145%) brightness(105%)' },
  { id: 'selfie', name: 'Selfie Glow', category: 'Beauty', css: 'brightness(112%) contrast(98%) saturate(110%)' },
  { id: 'minimal', name: 'Minimal White', category: 'Basic', css: 'contrast(105%) brightness(108%) saturate(80%)' },
];

class FilterEngineRegistry {
  constructor() {
    this.customFilters = new Map();
  }

  // Register a custom filter algorithm dynamically
  registerFilter(id, name, category, cssStringOrFn) {
    this.customFilters.set(id, { id, name, category, css: cssStringOrFn });
  }

  getAllFilters() {
    const registered = Array.from(this.customFilters.values());
    return [...EXTENDED_FILTER_PRESETS, ...registered];
  }

  getFilterById(id) {
    if (this.customFilters.has(id)) return this.customFilters.get(id);
    return EXTENDED_FILTER_PRESETS.find(f => f.id === id) || EXTENDED_FILTER_PRESETS[0];
  }

  // Apply CSS Filter or Canvas Context 2D transformations
  applyFilterToCanvas(canvas, filterCSS) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.filter = filterCSS || 'none';
  }
}

export const FilterEngine = new FilterEngineRegistry();
