import { getValidationBenchmark } from '../services/validationService.js';

export async function getValidationData(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const benchmark = getValidationBenchmark(forceRefresh);
    res.json({
      success: true,
      data: benchmark
    });
  } catch (err) {
    next(err);
  }
}
