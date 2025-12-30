const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'taskDashboard';
let db;
let tasksCollection;

// In-memory fallback storage (if MongoDB is not available)
let inMemoryTasks = [
  {
    _id: '1',
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the new feature',
    status: 'pending',
    createdAt: new Date('2024-12-28'),
    dueDate: new Date('2025-01-05')
  },
  {
    _id: '2',
    title: 'Review pull requests',
    description: 'Review and merge pending PRs from team members',
    status: 'completed',
    createdAt: new Date('2024-12-25'),
    dueDate: new Date('2024-12-30')
  },
  {
    _id: '3',
    title: 'Update dependencies',
    description: 'Update all npm packages to latest versions',
    status: 'pending',
    createdAt: new Date('2024-12-20'),
    dueDate: new Date('2024-12-28')
  },
  {
    _id: '4',
    title: 'Fix authentication bug',
    description: 'Resolve the token refresh issue in production',
    status: 'pending',
    createdAt: new Date('2024-12-27'),
    dueDate: new Date('2025-01-02')
  }
];

let useInMemory = false;
let nextId = 5;

// Connect to MongoDB
async function connectToDatabase() {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    db = client.db(DB_NAME);
    tasksCollection = db.collection('tasks');
    
    // Initialize with sample data if collection is empty
    const count = await tasksCollection.countDocuments();
    if (count === 0) {
      await tasksCollection.insertMany(inMemoryTasks.map(task => ({
        ...task,
        _id: new ObjectId(),
        createdAt: new Date(task.createdAt),
        dueDate: new Date(task.dueDate)
      })));
      console.log('✅ Sample data inserted');
    }
  } catch (error) {
    console.warn('⚠️  MongoDB not available, using in-memory storage');
    console.warn('   To use MongoDB, set MONGO_URI in .env file');
    useInMemory = true;
  }
}

// Helper function to get tasks (from DB or memory)
async function getTasks() {
  if (useInMemory) {
    return inMemoryTasks;
  }
  return await tasksCollection.find({}).toArray();
}

// Helper function to add task
async function addTask(task) {
  if (useInMemory) {
    const newTask = {
      ...task,
      _id: String(nextId++),
      createdAt: new Date(),
      dueDate: task.dueDate ? new Date(task.dueDate) : null
    };
    inMemoryTasks.push(newTask);
    return newTask;
  }
  
  const result = await tasksCollection.insertOne({
    ...task,
    createdAt: new Date(),
    dueDate: task.dueDate ? new Date(task.dueDate) : null
  });
  return await tasksCollection.findOne({ _id: result.insertedId });
}

// Helper function to update task
async function updateTask(id, updates) {
  if (useInMemory) {
    const index = inMemoryTasks.findIndex(t => t._id === id);
    if (index === -1) return null;
    inMemoryTasks[index] = { ...inMemoryTasks[index], ...updates };
    return inMemoryTasks[index];
  }
  
  await tasksCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updates }
  );
  return await tasksCollection.findOne({ _id: new ObjectId(id) });
}

// Helper function to delete task
async function deleteTask(id) {
  if (useInMemory) {
    const index = inMemoryTasks.findIndex(t => t._id === id);
    if (index === -1) return false;
    inMemoryTasks.splice(index, 1);
    return true;
  }
  
  const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// Routes

// GET /tasks - Get all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await getTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/:id - Get single task
app.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (useInMemory) {
      const task = inMemoryTasks.find(t => t._id === id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      return res.json(task);
    }
    
    const task = await tasksCollection.findOne({ _id: new ObjectId(id) });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /tasks - Create new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, status, dueDate } = req.body;
    
    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const newTask = {
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'pending',
      dueDate: dueDate || null
    };
    
    const task = await addTask(newTask);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update task
app.put('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, dueDate } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
    
    const updatedTask = await updateTask(id, updates);
    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteTask(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    storage: useInMemory ? 'in-memory' : 'mongodb',
    timestamp: new Date()
  });
});

// Start server
async function startServer() {
  await connectToDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Storage mode: ${useInMemory ? 'In-Memory' : 'MongoDB'}`);
  });
}

startServer();