import { getNotificationsForUser, markAllNotificationsRead, markNotificationRead } from '../services/notificationService.js';

export async function getNotifications(req, res, next) {
  try {
    const list = await getNotificationsForUser({
      username: req.user.username,
      role: req.user.role
    });
    res.status(200).json({
      success: true,
      data: list
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const list = await markAllNotificationsRead({
      username: req.user.username,
      role: req.user.role
    });
    res.status(200).json({
      success: true,
      data: list
    });
  } catch (err) {
    next(err);
  }
}

export async function markSingleRead(req, res, next) {
  try {
    const { id } = req.params;
    const result = await markNotificationRead(id, {
      username: req.user.username,
      role: req.user.role
    });
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

