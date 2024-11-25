import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from './db.js';
import User from './User.js';
import mongoose from 'mongoose';


// Load environment variables
dotenv.config();


mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ClickUp API Config
const CLICKUP_API_BASE_URL = 'https://api.clickup.com/api/v2';
const CLICKUP_TOKEN = process.env.CLICKUP_AUTH_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secure-secret';

// Validate environment variables
if (!CLICKUP_TOKEN) {
    console.error('Missing required environment variables. Check .env file.');
    process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = 5000;

// Middleware
app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
app.use(bodyParser.json());

// Utility function to log errors
const logError = (error) => {
    if (error.response) {
        console.error('Error Response:', error.response.data);
    } else if (error.request) {
        console.error('No Response Received:', error.request);
    } else {
        console.error('Unexpected Error:', error.message);
    }
};

//Login Route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      console.error('Login error: Missing email or password.');
      return res.status(400).json({ error: 'Email and password are required.' });
    }
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.error(`Login error: No user found with email: ${email}`);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.error('Login error: Password mismatch.');
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
  
      const token = jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      console.log('Successful login:', { token, user: { id: user._id, name: user.name, email: user.email } });
  
      res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
      console.error('Unexpected server error:', error.message, error.stack);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
  
  
// Endpoint to fetch a task by ID with resolved assignees
app.get('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
  
    try {
      // Fetch task details from your database or ClickUp API
      const taskResponse = await axios.get(`${CLICKUP_API_BASE_URL}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
      });
  
      const task = taskResponse.data;
  
      // Resolve assignee names
      if (task.assignees && task.assignees.length > 0) {
        const resolvedAssignees = task.assignees.map((assignee) => {
          return {
            id: assignee.id,
            name: assignee.username || 'Unknown', // Fallback to 'Unknown' if name isn't available
          };
        });
  
        task.assignees = resolvedAssignees;
      }
  
      // Send task details with resolved assignees
      res.status(200).json(task);
    } catch (error) {
      console.error('Error fetching task details:', error.message);
      res.status(500).json({ error: 'Failed to fetch task details.' });
    }
  });
  

  //Resolving Assignee Names
  app.post('/resolve-assignees', async (req, res) => {
    const { assigneeIds } = req.body;
    if (!Array.isArray(assigneeIds)) {
      return res.status(400).json({ error: 'Invalid assignee IDs' });
    }
  
    try {
      const resolvedAssignees = await Promise.all(
        assigneeIds.map(async (id) => {
          const user = await fetchUserDetailsFromDatabaseOrAPI(id); // Replace with actual logic
          return { id, name: user.name };
        })
      );
      res.status(200).json(resolvedAssignees);
    } catch (error) {
      console.error('Error resolving assignees:', error);
      res.status(500).json({ error: 'Failed to resolve assignees' });
    }
  });
  
  
  

// =======================
// ROUTES
// =======================

// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('Server is running!');
});

// Fetch Team Info
app.get('/team-info', async (req, res) => {
    try {
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/team`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });
        res.status(200).json(response.data);
    } catch (error) {
        logError(error);
        res.status(500).json({ error: error.response?.data || 'Failed to fetch team info.' });
    }
});

// Fetch Workspace Members
app.get('/workspace-members/:teamId', async (req, res) => {
    const { teamId } = req.params;

    try {
        // Fetch workspace members from ClickUp API
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/team/${teamId}`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });

        console.log('Raw API Response:', response.data); // Debugging log

        // Map members to simplified structure
        const members = response.data.team?.members.map((member) => ({
            id: member.user.id,
            name: member.user.username,
        })) || [];

        res.status(200).json({ members });
    } catch (error) {
        logError(error); // Log the error in detail
        res.status(500).json({ error: 'Failed to fetch workspace members.' });
    }
});

app.post('/lists/:listId/tasks', async (req, res) => {
    const { listId } = req.params;
    const { name, description, assignees, priority, start_date, due_date } = req.body;

    if (!listId || !name) {
        return res.status(400).json({ error: 'List ID and task name are required.' });
    }

    try {
        const taskData = {
            name,
            description: description || '',
            assignees: Array.isArray(assignees) ? assignees : [],
            priority: priority || 3,
            start_date: start_date ? new Date(start_date).getTime() : null,
            due_date: due_date ? new Date(due_date).getTime() : null,
        };

        const response = await axios.post(
            `${CLICKUP_API_BASE_URL}/list/${listId}/task`,
            taskData,
            {
                headers: {
                    Authorization: `Bearer ${CLICKUP_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.status(201).json(response.data);
    } catch (error) {
        console.error('Error creating task:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create task.' });
    }
});


// Create Space
app.post('/create-space', async (req, res) => {
    const { name, teamId } = req.body;

    if (!name || !teamId) {
        return res.status(400).json({ error: 'Space name and teamId are required.' });
    }

    try {
        const response = await axios.post(
            `${CLICKUP_API_BASE_URL}/team/${teamId}/space`,
            { name },
            { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
        );

        res.status(201).json(response.data);
    } catch (error) {
        logError(error);
        res.status(500).json({ error: 'Failed to create space.' });
    }
});

// Fetch Spaces
app.get('/spaces/:teamId', async (req, res) => {
    const { teamId } = req.params;

    try {
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/team/${teamId}/space`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });

        res.status(200).json(response.data);
    } catch (error) {
        logError(error);
        res.status(500).json({ error: 'Failed to fetch spaces.' });
    }
});
//Create a new folder
app.post('/create-folder', async (req, res) => {
    const { name, spaceId } = req.body;
  
    if (!name || !spaceId) {
      return res.status(400).json({ error: 'Folder name and spaceId are required.' });
    }
  
    try {
      const response = await axios.post(
        `${CLICKUP_API_BASE_URL}/space/${spaceId}/folder`,
        { name, hidden: false },
        { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
      );
  
      res.status(201).json(response.data);
    } catch (error) {
      console.error('Error creating folder:', error.message);
      res.status(500).json({ error: 'Failed to create folder.' });
    }
  });
  

//Create a new list
app.post('/create-list', async (req, res) => {
    const { name, folderId } = req.body;

    if (!name || !folderId) {
        console.error('Invalid request payload:', { name, folderId });
        return res.status(400).json({ error: 'List name and folderId are required.' });
    }

    try {
        const response = await axios.post(
            `${CLICKUP_API_BASE_URL}/folder/${folderId}/list`,
            { name },
            { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
        );

        console.log('List created successfully:', response.data);
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Error creating list:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to create list.' });
    }
});




app.post('/create-task', async (req, res) => {
  const { listId, name, description, assignees, priority, start_date, due_date, status } = req.body;

  if (!listId || !name) {
    return res.status(400).json({ error: 'List ID and task name are required.' });
  }

  const validateDate = (date) => {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  };

  if (start_date && !validateDate(start_date)) {
    return res.status(400).json({ error: 'Invalid Start Date format.' });
  }

  if (due_date && !validateDate(due_date)) {
    return res.status(400).json({ error: 'Invalid Due Date format.' });
  }

  try {
    const taskData = {
      name,
      description: description || '',
      assignees: Array.isArray(assignees) ? assignees : [],
      priority: priority || 3,
      start_date: start_date ? new Date(start_date).getTime() : null,
      due_date: due_date ? new Date(due_date).getTime() : null,
      status: status || 'to do',
    };

    const response = await axios.post(
      `${CLICKUP_API_BASE_URL}/list/${listId}/task`,
      taskData,
      {
        headers: {
          Authorization: `Bearer ${CLICKUP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(201).json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error creating task:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});



// Fetch Folders
app.get('/folders/:spaceId', async (req, res) => {
    const { spaceId } = req.params;
  
    try {
      const response = await axios.get(`${CLICKUP_API_BASE_URL}/space/${spaceId}/folder`, {
        headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
      });
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error.message);
      res.status(500).json({ error: 'Failed to fetch folders.' });
    }
  });
  
// Fetch Lists
app.get('/lists/:folderId', async (req, res) => {
    const { folderId } = req.params;

    if (!folderId) {
        return res.status(400).json({ error: 'Folder ID is required.' });
    }

    try {
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/folder/${folderId}/list`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching lists:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch lists.' });
    }
});


// Fetch Tasks
app.get('/lists/:listId/tasks', async (req, res) => {
    const { listId } = req.params;
    try {
      const response = await axios.get(`${CLICKUP_API_BASE_URL}/list/${listId}/task`, {
        headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
      });
      res.status(200).json(response.data);
    } catch (error) {
      logError(error); // Log details for debugging
      res.status(404).json({ error: 'List not found or unauthorized access.' });
    }
  });
  
  app.get('/workspace-members/:teamId', async (req, res) => {
    const { teamId } = req.params;

    try {
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/team/${teamId}`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });

        const members = response.data.team?.members.map((member) => ({
            id: member.user.id,
            name: member.user.username,
        })) || [];

        res.status(200).json({ members });
    } catch (error) {
        console.error('Error fetching workspace members:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch workspace members.' });
    }
});

// =======================
// Workspace Analytics
// =======================
app.get('/workspace-analytics', async (req, res) => {
    const teamId = req.query.teamId || '9012517272';

    try {
        const response = await axios.get(`${CLICKUP_API_BASE_URL}/team/${teamId}/task`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });

        const tasks = response.data.tasks;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.status?.status === 'complete').length;
        const pendingTasks = totalTasks - completedTasks;

        const tasksByPriority = tasks.reduce(
            (acc, task) => {
                const priority = task.priority?.priority || 'unknown';
                acc[priority] = (acc[priority] || 0) + 1;
                return acc;
            },
            { low: 0, medium: 0, high: 0, urgent: 0 }
        );

        const tasksByStatus = tasks.reduce((acc, task) => {
            const status = task.status?.status || 'Unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            totalTasks,
            completedTasks,
            pendingTasks,
            tasksByPriority,
            tasksByStatus,
        });
    } catch (error) {
        logError(error);
        res.status(500).json({ error: 'Failed to fetch workspace analytics.' });
    }
});

app.put('/spaces/:spaceId', async (req, res) => {
    const { spaceId } = req.params;
    const { name } = req.body;
  
    if (!name || !spaceId) {
      return res.status(400).json({ error: 'Space name and ID are required.' });
    }
  
    try {
      const response = await axios.put(
        `${CLICKUP_API_BASE_URL}/space/${spaceId}`,
        { name },
        { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
      );
  
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error updating space:', error.message);
      res.status(500).json({ error: 'Failed to update space.' });
    }
  });
  
  app.delete('/spaces/:spaceId', async (req, res) => {
    const { spaceId } = req.params;
  
    if (!spaceId) {
      return res.status(400).json({ error: 'Space ID is required.' });
    }
  
    try {
      const response = await axios.delete(`${CLICKUP_API_BASE_URL}/space/${spaceId}`, {
        headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
      });
  
      res.status(200).json({ message: 'Space deleted successfully.' });
    } catch (error) {
      console.error('Error deleting space:', error.message);
      res.status(500).json({ error: 'Failed to delete space.' });
    }
  });

  // Update a Folder
app.put('/folders/:folderId', async (req, res) => {
    const { folderId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Folder name is required.' });
    }

    try {
        const response = await axios.put(
            `${CLICKUP_API_BASE_URL}/folder/${folderId}`,
            { name },
            { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating folder:', error.message);
        res.status(500).json({ error: 'Failed to update folder.' });
    }
});

// Delete a Folder
app.delete('/folders/:folderId', async (req, res) => {
    const { folderId } = req.params;

    try {
        await axios.delete(`${CLICKUP_API_BASE_URL}/folder/${folderId}`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });
        res.status(200).json({ success: true, message: 'Folder deleted successfully.' });
    } catch (error) {
        console.error('Error deleting folder:', error.message);
        res.status(500).json({ error: 'Failed to delete folder.' });
    }
});

// Update a List
app.put('/lists/:listId', async (req, res) => {
    const { listId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'List name is required.' });
    }

    try {
        const response = await axios.put(
            `${CLICKUP_API_BASE_URL}/list/${listId}`,
            { name },
            { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
        );
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating list:', error.message);
        res.status(500).json({ error: 'Failed to update list.' });
    }
});

// Delete a List
app.delete('/lists/:listId', async (req, res) => {
    const { listId } = req.params;

    try {
        await axios.delete(`${CLICKUP_API_BASE_URL}/list/${listId}`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });
        res.status(200).json({ success: true, message: 'List deleted successfully.' });
    } catch (error) {
        console.error('Error deleting list:', error.message);
        res.status(500).json({ error: 'Failed to delete list.' });
    }
});

// Update a Task
app.put('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { name, description, priority, start_date, due_date } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Task name is required.' });
    }

    try {
        const taskData = {
            name,
            description: description || '',
            priority: priority || 3,
            start_date: start_date ? new Date(start_date).getTime() : null,
            due_date: due_date ? new Date(due_date).getTime() : null,
        };

        const response = await axios.put(
            `${CLICKUP_API_BASE_URL}/task/${taskId}`,
            taskData,
            { headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` } }
        );

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ error: 'Failed to update task.' });
    }
});

// Delete a Task
app.delete('/tasks/:taskId', async (req, res) => {
    const { taskId } = req.params;

    try {
        await axios.delete(`${CLICKUP_API_BASE_URL}/task/${taskId}`, {
            headers: { Authorization: `Bearer ${CLICKUP_TOKEN}` },
        });
        res.status(200).json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Error deleting task:', error.message);
        res.status(500).json({ error: 'Failed to delete task.' });
    }
});

  

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
