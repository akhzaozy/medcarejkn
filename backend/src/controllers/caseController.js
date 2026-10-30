import { getAllCases, getCaseById, getCaseEvidence, submitCaseOutcome, assignCaseReviewer, saveCaseFile, getCaseFile } from '../services/caseService.js';

export async function getCases(req, res, next) {
  try {
    const { status, priority, riskMode, reasonCode, search, assignedTo, page, limit } = req.query;
    const result = await getAllCases({ status, priority, riskMode, reasonCode, search, assignedTo:req.user.role==='clinical_reviewer'?req.user.username:assignedTo, page, limit });
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
        message: 'Kasus tidak ditemukan.'
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
        message: 'Kasus tidak ditemukan.'
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
    const { outcome, notes, reviewerId, allowRevision } = req.body;

    if (!outcome) {
      return res.status(400).json({
        success: false,
        message: 'Outcome is required (CONFIRMED, NOT_CONFIRMED, NEEDS_MORE_EVIDENCE, FALSE_POSITIVE)'
      });
    }

    const result = await submitCaseOutcome(caseId, {
      outcome,
      notes,
      reviewerId:req.user.username,reviewerName:req.user.name,allowRevision:Boolean(allowRevision)
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
      assignedBy:req.user.username
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

export async function uploadCaseFile(req, res, next) {
  try {
    const { caseId } = req.params;
    const rawName = req.headers['x-file-name'] ? decodeURIComponent(String(req.headers['x-file-name'])) : 'dokumen.pdf';
    const kind = String(req.headers['x-file-kind'] || 'evidence');
    const mimeType = String(req.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
    const result = await saveCaseFile(caseId, {
      buffer: req.body,
      originalName: rawName,
      mimeType,
      kind,
      actor: req.user
    });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadCaseFile(req, res, next) {
  try {
    const { caseId, fileId } = req.params;
    const fileInfo = await getCaseFile(caseId, fileId);
    res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileInfo.fileName)}"`);
    res.sendFile(fileInfo.filePath);
  } catch (err) {
    next(err);
  }
}
