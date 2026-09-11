import { runFullAnalysis } from '../services/analysisService.js';

export async function runAnalysis(req, res, next) {
  try {
    const result = await runFullAnalysis();
    res.status(200).json({
      success: true,
      message: 'Decision Engine analysis ran successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}
