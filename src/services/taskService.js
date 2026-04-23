import apiService from './apiService';
import { API_ENDPOINTS } from '../config/api';

class TaskService {
  normalizeTask(task = {}) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    return {
      id: task.id || task._id,
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'Other',
      priority: task.priority || 'medium',
      status: (task.status || 'pending').toLowerCase(),
      dueDate,
      dueDateISO: dueDate ? dueDate.toISOString() : null,
      reminderAt: task.reminderAt || null,
      completedAt: task.completedAt || null,
      notes: task.notes || '',
      createdAt: task.createdAt || null,
      updatedAt: task.updatedAt || null,
    };
  }

  async createTask(taskData) {
    const response = await apiService.post(API_ENDPOINTS.TASKS.CREATE, taskData);
    return this.normalizeTask(response?.data || response);
  }

  async getMyTasks(filters = {}) {
    const query = new URLSearchParams();

    if (filters.status) query.append('status', String(filters.status));
    if (filters.category && filters.category !== 'all') query.append('category', String(filters.category));
    if (filters.fromDate) query.append('fromDate', String(filters.fromDate));
    if (filters.toDate) query.append('toDate', String(filters.toDate));

    const endpoint = query.toString()
      ? `${API_ENDPOINTS.TASKS.MY_TASKS}?${query.toString()}`
      : API_ENDPOINTS.TASKS.MY_TASKS;

    const response = await apiService.get(endpoint);
    const tasks = Array.isArray(response?.data) ? response.data : [];

    return tasks.map((task) => this.normalizeTask(task));
  }

  async updateTask(taskId, updates) {
    const response = await apiService.put(API_ENDPOINTS.TASKS.UPDATE(taskId), updates);
    return this.normalizeTask(response?.data || response);
  }

  async deleteTask(taskId) {
    return apiService.delete(API_ENDPOINTS.TASKS.DELETE(taskId));
  }

  async toggleTaskStatus(task) {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    return this.updateTask(task.id, { status: nextStatus });
  }
}

export default new TaskService();
