import pool from '../config/db.js';
import { randomUUID } from 'node:crypto';

export async function createNotification(dbOrClient, {
  caseId = null,
  recipientUsername = null,
  recipientRole = null,
  senderUsername = 'system',
  senderName = 'Sistem',
  title,
  message,
  type = 'info'
}) {
  const client = dbOrClient || pool;
  const id = `notif-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  await client.query(`
    INSERT INTO notifications (id, case_id, recipient_username, recipient_role, sender_username, sender_name, title, message, type, read, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, CURRENT_TIMESTAMP)
  `, [id, caseId, recipientUsername, recipientRole, senderUsername, senderName, title, message, type]);
  return id;
}

export async function getNotificationsForUser({ username, role }) {
  const result = await pool.query(`
    SELECT 
      id,
      case_id as "caseId",
      recipient_username as "recipientUsername",
      recipient_role as "recipientRole",
      sender_username as "senderUsername",
      sender_name as "senderName",
      title,
      message,
      type,
      read,
      created_at as "timestamp"
    FROM notifications
    WHERE (recipient_username = $1 OR (recipient_username IS NULL AND recipient_role = $2))
    ORDER BY created_at DESC
    LIMIT 30
  `, [username, role]);
  return result.rows;
}

export async function markAllNotificationsRead({ username, role }) {
  await pool.query(`
    UPDATE notifications
    SET read = TRUE
    WHERE (recipient_username = $1 OR (recipient_username IS NULL AND recipient_role = $2))
      AND read = FALSE
  `, [username, role]);
  return getNotificationsForUser({ username, role });
}

export async function markNotificationRead(id, { username, role }) {
  await pool.query(`
    UPDATE notifications
    SET read = TRUE
    WHERE id = $1
      AND (recipient_username = $2 OR (recipient_username IS NULL AND recipient_role = $3))
  `, [id, username, role]);
  return { success: true, id };
}

