import cropService from './cropService';

class MarketService {
  normalizeMarketRows(crops = []) {
    const grouped = new Map();

    crops.forEach((crop) => {
      const cropName = crop.cropName || 'Unknown Crop';
      const category = crop.category || 'Other';
      const unit = crop.unit || 'kg';
      const city = crop?.location?.city || crop?.locationDetails?.district || 'Local Market';
      const state = crop?.location?.state || crop?.locationDetails?.state || '';
      const price = Number(crop.price || crop.pricePerUnit || 0);

      if (!Number.isFinite(price) || price <= 0) return;

      const key = `${cropName.toLowerCase()}|${unit.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          cropName,
          category,
          unit,
          count: 0,
          totalPrice: 0,
          minPrice: price,
          maxPrice: price,
          markets: new Set(),
          lastUpdated: crop.updatedAt || crop.createdAt || null,
        });
      }

      const entry = grouped.get(key);
      entry.count += 1;
      entry.totalPrice += price;
      entry.minPrice = Math.min(entry.minPrice, price);
      entry.maxPrice = Math.max(entry.maxPrice, price);
      entry.markets.add([city, state].filter(Boolean).join(', '));

      const candidateDate = new Date(crop.updatedAt || crop.createdAt || Date.now());
      const existingDate = entry.lastUpdated ? new Date(entry.lastUpdated) : null;
      if (!existingDate || candidateDate > existingDate) {
        entry.lastUpdated = candidateDate.toISOString();
      }
    });

    return Array.from(grouped.values())
      .map((entry) => ({
        id: entry.id,
        cropName: entry.cropName,
        category: entry.category,
        unit: entry.unit,
        sampleSize: entry.count,
        averagePrice: entry.count > 0 ? Number((entry.totalPrice / entry.count).toFixed(2)) : 0,
        minPrice: Number(entry.minPrice.toFixed(2)),
        maxPrice: Number(entry.maxPrice.toFixed(2)),
        markets: Array.from(entry.markets).slice(0, 3),
        lastUpdated: entry.lastUpdated,
        trend: entry.maxPrice > entry.minPrice * 1.15 ? 'volatile' : 'stable',
      }))
      .sort((a, b) => b.averagePrice - a.averagePrice);
  }

  async getMarketPrices(filters = {}) {
    const response = await cropService.getAvailableCrops(filters);
    const crops = response?.data || response?.crops || [];
    const normalizedRows = this.normalizeMarketRows(crops);

    return {
      data: normalizedRows,
      total: normalizedRows.length,
      raw: response,
    };
  }
}

export default new MarketService();
