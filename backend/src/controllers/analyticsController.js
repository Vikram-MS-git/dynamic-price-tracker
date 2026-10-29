import * as analyticsService from '../services/analyticsService.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await analyticsService.getDashboardStats();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
