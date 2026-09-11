import { getAllCases, getCaseById, getCaseEvidence, submitCaseOutcome, assignCaseReviewer } from '../services/caseService.js';

export async function getCases(req, res, next) {
  try {
    const { status, priority, riskMode, search, assignedTo, page, limit } = req.query;
    const result = await getAllCases({ status, priority, riskMode, search, assignedTo, page, limit });
    res.status(200).json({
      success: true,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      data: result.cases
    });
  } catch (err) {
    next(err);
  }
}

export async function getCaseDetails(req, res, next) {
  try {
    const { caseId } = req.params;
    const caseData = await getCaseById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: `Case not found: ${caseId}`
      });
    }
    res.status(200).json({
      success: true,
      data: caseData
    });
  } catch (err) {
    next(err);
  }
}

export async function getCaseEvidenceChain(req, res, next) {
  try {
    const { caseId } = req.params;
    const chain = await getCaseEvidence(caseId);
    if (!chain) {
      return res.status(404).json({
        success: false,
        message: `Case not found: ${caseId}`
      });
    }
    res.status(200).json({
      success: true,
      data: chain
    });
  } catch (err) {
    next(err);
  }
}

export async function postCaseOutcome(req, res, next) {
  try {
    const { caseId } = req.params;
    const { outcome, notes, reviewerId } = req.body;

    if (!outcome) {
      return res.status(400).json({
        success: false,
        message: 'Outcome is required (CONFIRMED, NOT_CONFIRMED, NEEDS_MORE_EVIDENCE, FALSE_POSITIVE)'
      });
    }

    const result = await submitCaseOutcome(caseId, {
      outcome,
      notes,
      reviewerId: reviewerId || 'reviewer-001'
    });

    res.status(200).json({
      success: true,
      message: 'Review outcome recorded successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function assignCase(req, res, next) {
  try {
    const { caseId } = req.params;
    const { assignedTo, assignedName, note, assignedBy } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Reviewer (assignedTo) is required'
      });
    }

    const result = await assignCaseReviewer(caseId, {
      assignedTo,
      assignedName: assignedName || 'Tenaga Kesehatan (Reviewer)',
      note,
      assignedBy: assignedBy || 'Staff JKN'
    });

    res.status(200).json({
      success: true,
      message: `Kasus ${caseId} berhasil ditugaskan ke ${assignedName || assignedTo}`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}
