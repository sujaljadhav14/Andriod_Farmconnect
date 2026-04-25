const express = require('express');
const Task = require('../models/Task');

const createTaskRoutes = ({ authenticateToken }) => {
  const router = express.Router();

  router.post('/create', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can create tasks' });
      }

      const {
        title,
        description = '',
        category = 'Other',
        priority = 'medium',
        dueDate,
        notes = '',
        reminderAt,
      } = req.body || {};

      if (!title || !dueDate) {
        return res.status(400).json({ message: 'title and dueDate are required' });
      }

      const parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: 'Invalid dueDate value' });
      }

      const task = await Task.create({
        farmerId: req.user._id,
        title: String(title).trim(),
        description: String(description).trim(),
        category,
        priority,
        dueDate: parsedDueDate,
        notes: String(notes).trim(),
        reminderAt: reminderAt ? new Date(reminderAt) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      console.error('Create farm task error:', error);
      res.status(500).json({ message: 'Failed to create task', error: error.message });
    }
  });

  router.get('/my-tasks', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can access tasks' });
      }

      const { status, category, fromDate, toDate } = req.query;

      const query = {
        farmerId: req.user._id,
      };

      if (status) {
        query.status = status;
      }
      if (category && category !== 'all') {
        query.category = category;
      }
      if (fromDate || toDate) {
        query.dueDate = {};
        if (fromDate) query.dueDate.$gte = new Date(fromDate);
        if (toDate) query.dueDate.$lte = new Date(toDate);
      }

      const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });

      res.json({
        success: true,
        data: tasks,
        total: tasks.length,
      });
    } catch (error) {
      console.error('Get farm tasks error:', error);
      res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
    }
  });

  router.put('/update/:taskId', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can update tasks' });
      }

      const task = await Task.findOne({
        _id: req.params.taskId,
        farmerId: req.user._id,
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const { title, description, category, priority, dueDate, status, notes, reminderAt } = req.body || {};

      if (title !== undefined) task.title = String(title).trim();
      if (description !== undefined) task.description = String(description).trim();
      if (category) task.category = category;
      if (priority) task.priority = priority;
      if (notes !== undefined) task.notes = String(notes).trim();
      if (dueDate) {
        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime())) {
          return res.status(400).json({ message: 'Invalid dueDate value' });
        }
        task.dueDate = parsedDueDate;
      }
      if (reminderAt !== undefined) {
        task.reminderAt = reminderAt ? new Date(reminderAt) : undefined;
      }
      if (status) {
        task.status = status;
        task.completedAt = status === 'completed' ? new Date() : undefined;
      }

      await task.save();

      res.json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      console.error('Update farm task error:', error);
      res.status(500).json({ message: 'Failed to update task', error: error.message });
    }
  });

  router.delete('/delete/:taskId', authenticateToken, async (req, res) => {
    try {
      if (req.user.role !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can delete tasks' });
      }

      const task = await Task.findOneAndDelete({
        _id: req.params.taskId,
        farmerId: req.user._id,
      });

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Delete farm task error:', error);
      res.status(500).json({ message: 'Failed to delete task', error: error.message });
    }
  });

  return router;
};

module.exports = { createTaskRoutes };
