import { getDashboardMetrics } from '../services/dashboardService.js';

export async function getDashboard(req, res, next) {
  try {
    const { assignedTo, role } = req.query;
    const data = await getDashboardMetrics(req.user.role==='clinical_reviewer'?{assignedTo:req.user.username,role:req.user.role}:{role:req.user.role});
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}
