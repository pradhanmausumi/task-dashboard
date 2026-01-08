import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Plus,
  Search,
  Filter,
  Check,
  Edit2,
  Trash2,
  Clock,
  AlertCircle,
  Moon,
  Sun,
  Grid,
  List
} from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:5000/api';///API

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [darkMode, setDarkMode] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    dueDate: ''
  });

  // Fetch tasks from API
  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search and status
  useEffect(() => {
    let filtered = tasks;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filterStatus, searchQuery]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !editingTask) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const updatedTask = await response.json();
      setTasks(tasks.map(task => task._id === editingTask._id ? updatedTask : task));
      resetForm();
      setShowModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;

    try {
      await fetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    try {
      const response = await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const updatedTask = await response.json();
      setTasks(tasks.map(t => t._id === task._id ? updatedTask : t));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      dueDate: ''
    });
    setEditingTask(null);
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  // Statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => isOverdue(t)).length
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="logo">
            <CheckSquare size={28} />
            <h1>TASK//DASH</h1>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="user-avatar">
            <div className="avatar">JD</div>
            <div className="user-info">
              <span className="user-name">John Doe</span>
              <span className="user-greeting">Welcome back!</span>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="nav-menu">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <item.icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="content">
          {activeSection === 'dashboard' && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card animate-in" style={{ animationDelay: '0.1s' }}>
                  <div className="stat-icon total">
                    <CheckSquare size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stats.total}</h3>
                    <p className="stat-label">Total Tasks</p>
                  </div>
                </div>

                <div className="stat-card animate-in" style={{ animationDelay: '0.15s' }}>
                  <div className="stat-icon pending">
                    <Clock size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stats.pending}</h3>
                    <p className="stat-label">Pending</p>
                  </div>
                </div>

                <div className="stat-card animate-in" style={{ animationDelay: '0.2s' }}>
                  <div className="stat-icon completed">
                    <Check size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stats.completed}</h3>
                    <p className="stat-label">Completed</p>
                  </div>
                </div>

                <div className="stat-card animate-in" style={{ animationDelay: '0.25s' }}>
                  <div className="stat-icon overdue">
                    <AlertCircle size={24} />
                  </div>
                  <div className="stat-content">
                    <h3 className="stat-value">{stats.overdue}</h3>
                    <p className="stat-label">Overdue</p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="controls-bar">
                <div className="search-container">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="control-buttons">
                  <div className="filter-group">
                    <Filter size={18} />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Tasks</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="view-toggle">
                    <button
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                  >
                    <Plus size={18} />
                    New Task
                  </button>
                </div>
              </div>

              {/* Tasks Display */}
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading tasks...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <CheckSquare size={64} />
                  <h2>No tasks found</h2>
                  <p>Create your first task to get started!</p>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      resetForm();
                      setShowModal(true);
                    }}
                  >
                    <Plus size={18} />
                    Create Task
                  </button>
                </div>
              ) : (
                <div className={`tasks-${viewMode}`}>
                  {filteredTasks.map((task, index) => (
                    <div
                      key={task._id}
                      className={`task-card ${task.status} ${isOverdue(task) ? 'overdue' : ''}`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                        <div className="task-actions">
                          <button
                            className="icon-btn success"
                            onClick={() => toggleTaskStatus(task)}
                            title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                          >
                            <Check size={18} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => openEditModal(task)}
                            title="Edit task"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => handleDeleteTask(task._id)}
                            title="Delete task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}

                      <div className="task-footer">
                        <span className={`status-badge ${task.status}`}>
                          {task.status}
                        </span>
                        {task.dueDate && (
                          <span className={`due-date ${isOverdue(task) ? 'overdue' : ''}`}>
                            <Clock size={14} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {isOverdue(task) && (
                        <div className="overdue-badge">
                          <AlertCircle size={14} />
                          OVERDUE
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeSection === 'tasks' && (
            <div className="section-placeholder">
              <CheckSquare size={64} />
              <h2>Tasks Section</h2>
              <p>Advanced task management features coming soon</p>
            </div>
          )}

          {activeSection === 'analytics' && (
            <div className="section-placeholder">
              <BarChart3 size={64} />
              <h2>Analytics Section</h2>
              <p>Task statistics and insights coming soon</p>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="section-placeholder">
              <Settings size={64} />
              <h2>Settings Section</h2>
              <p>Customize your dashboard preferences</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => {
          setShowModal(false);
          resetForm();
        }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button
                className="icon-btn"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={editingTask ? handleUpdateTask : handleAddTask}>
              <div className="form-group">
                <label htmlFor="title">Task Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description"
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;