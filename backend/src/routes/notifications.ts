import express from 'express';
import { body, query, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { notificationService } from '../services/notificationService';

const router = express.Router();

// Get user's notifications
router.get(
  '/',
  authenticateToken,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit as number || 50;
      const offset = req.query.offset as number || 0;

      const notifications = await notificationService.getUserNotifications(userId, limit, offset);

      res.json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  }
);

// Get unread notifications count
router.get(
  '/unread-count',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch unread count',
      });
    }
  }
);

// Mark notification as read
router.patch(
  '/:id/read',
  authenticateToken,
  [
    param('id').isInt().toInt(),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = req.params.id as unknown as number;

      await notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  }
);

// Mark all notifications as read
router.patch(
  '/read-all',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user!.id;
      await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read',
      });
    }
  }
);

export { router as notificationRoutes };