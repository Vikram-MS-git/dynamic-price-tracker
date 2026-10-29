import * as groupModel from '../models/groupModel.js';
import * as productModel from '../models/productModel.js';

function computeStats(points) {
  if (!points.length) {
    return { min: null, max: null, avg: null, stdDev: null, pctChange: null, count: 0 };
  }

  const prices = points.map((p) => Number(p.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance =
    prices.reduce((sum, p) => sum + (p - avg) ** 2, 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const pctChange = first ? ((last - first) / first) * 100 : null;

  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    pctChange: pctChange !== null ? Math.round(pctChange * 100) / 100 : null,
    count: prices.length,
  };
}

export async function resolveGroupForProduct({ groupId, groupName, name, category }) {
  if (groupId) {
    const group = await groupModel.getGroupById(groupId);
    if (!group) throw new Error('Product group not found');
    return group;
  }

  const resolvedName = (groupName || name)?.trim();
  if (!resolvedName) throw new Error('group name or product name is required');

  const existing = await groupModel.findGroupByName(resolvedName);
  if (existing) return existing;

  return groupModel.createGroup({
    name: resolvedName,
    category: category?.trim() || null,
  });
}

export async function listGroups() {
  return groupModel.getAllGroups();
}

export async function compareGroup(groupId, dateRange = {}) {
  const group = await groupModel.getGroupById(groupId);
  if (!group) return null;

  const products = await groupModel.getProductsInGroup(groupId);
  if (!products.length) {
    return { group, series: [], stats: [] };
  }

  const productIds = products.map((p) => p.id);
  const history = await groupModel.getPriceHistoryForProducts(productIds, dateRange);

  const series = products.map((product) => {
    const points = history
      .filter((row) => row.product_id === product.id)
      .map((row) => ({
        scraped_at: row.scraped_at,
        price: Number(row.price),
      }));

    return {
      productId: product.id,
      name: product.name,
      platform: product.platform,
      points,
    };
  });

  const stats = series.map((s) => ({
    platform: s.platform,
    productId: s.productId,
    ...computeStats(s.points),
  }));

  return { group, series, stats };
}

export async function assignProductToGroup(productId, groupId) {
  return productModel.updateProductGroup(productId, groupId);
}
