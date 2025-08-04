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
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationService.getUserNotifications(userId);

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
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user!.userId;
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
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user!.userId;
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
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user!.userId;
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