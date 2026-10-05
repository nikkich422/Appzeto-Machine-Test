const BASE_URL = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.orgId = localStorage.getItem('currentOrgId');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  setOrgId(orgId) {
    this.orgId = orgId;
    if (orgId) {
      localStorage.setItem('currentOrgId', orgId);
    } else {
      localStorage.removeItem('currentOrgId');
    }
  }

  getOrgId() {
    return this.orgId;
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.orgId) {
      headers['x-organization-id'] = this.orgId;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Organizations
  async getOrganizations() {
    return this.request('/organizations');
  }

  async getOrganization(id) {
    return this.request(`/organizations/${id}`);
  }

  async createOrganization(name, slug) {
    return this.request('/organizations', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
  }

  async addMember(orgId, email, role) {
    return this.request(`/organizations/${orgId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async removeMember(orgId, userId) {
    return this.request(`/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Projects
  async getProjects(orgId) {
    const query = orgId ? `?organizationId=${orgId}` : '';
    return this.request(`/projects${query}`);
  }

  async getProject(id) {
    return this.request(`/projects/${id}`);
  }

  async createProject(name, description, orgId) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description, organizationId: orgId || this.orgId }),
    });
  }

  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    return this.request(`/tasks?${query.toString()}`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...taskData, organizationId: this.orgId }),
    });
  }

  async updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async addTaskComment(id, content) {
    return this.request(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Audit Logs
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    return this.request(`/audit-logs?${query.toString()}`);
  }

  // Notifications
  async getNotifications(unreadOnly = false) {
    return this.request(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'POST',
    });
  }
}

export const api = new ApiClient();
