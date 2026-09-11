import { getDashboardMetrics } from '../services/dashboardService.js';

export async function getDashboard(req, res, next) {
  try {
    const { assignedTo, role } = req.query;
    const data = await getDashboardMetrics({ assignedTo, role });
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}
