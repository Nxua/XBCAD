import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TasksPage.css';
import Select from 'react-select';
import { useParams, useLocation } from 'react-router-dom';

const TasksPage = () => {
  const { listId } = useParams();
  const { state } = useLocation();
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    assignees: [],
    due_date: '',
    start_date: '',
    priority: '3',
  });
  const [error, setError] = useState('');

  const selectedListId = listId || state?.listId;

  useEffect(() => {
    fetchWorkspaceMembers();
  }, []);

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/workspace-members/9012517272');
      setWorkspaceMembers(
        response.data.members.map((member) => ({
          value: member.id,
          label: member.name,
        }))
      );
    } catch (error) {
      console.error('Error fetching workspace members:', error);
      setError('Failed to fetch workspace members.');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name || !selectedListId) {
      setError('Task name and a valid list are required.');
      return;
    }
  
    // Validate date formats and ensure they can be parsed
    const validateDate = (date) => !isNaN(new Date(date).getTime());
  
    if (newTask.start_date && !validateDate(newTask.start_date)) {
      setError('Invalid Start Date format. Use YYYY-MM-DD.');
      return;
    }
  
    if (newTask.due_date && !validateDate(newTask.due_date)) {
      setError('Invalid Due Date format. Use YYYY-MM-DD.');
      return;
    }
  
    const payload = {
      name: newTask.name,
      description: newTask.description || '',
      assignees: newTask.assignees || [],
      priority: parseInt(newTask.priority, 10) || 3,
      start_date: newTask.start_date ? new Date(newTask.start_date).getTime() : null,
      due_date: newTask.due_date ? new Date(newTask.due_date).getTime() : null,
    };
  
    try {
      const response = await axios.post(`http://localhost:5000/lists/${selectedListId}/tasks`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.status === 201) {
        alert('Task created successfully!');
        setNewTask({
          name: '',
          description: '',
          assignees: [],
          due_date: '',
          start_date: '',
          priority: '3',
        });
        setError('');
      }
    } catch (err) {
      console.error('Failed to create task:', err.response?.data || err.message);
      setError('Failed to create task. Please try again.');
    }
  };
  

  return (
    <div className="tasks-page">
      <h1>Create a Task</h1>
      {error && <p className="error-message">{error}</p>}

      <div className="create-task-form">
        <label htmlFor="task-name" className="form-label">Task Name</label>
        <input
          id="task-name"
          type="text"
          placeholder="Task Name"
          value={newTask.name}
          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
          className="form-input"
        />

        <label htmlFor="task-description" className="form-label">Description</label>
        <textarea
          id="task-description"
          placeholder="Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="form-textarea"
        ></textarea>

        <label htmlFor="start-date" className="form-label">Start Date</label>
        <input
          id="start-date"
          type="date"
          value={newTask.start_date}
          onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
          className="form-input"
        />

        <label htmlFor="due-date" className="form-label">Due Date</label>
        <input
          id="due-date"
          type="date"
          value={newTask.due_date}
          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
          className="form-input"
        />

        <label htmlFor="priority" className="form-label">Priority</label>
        <select
          id="priority"
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          className="form-select"
        >
          <option value="1">Urgent</option>
          <option value="2">High</option>
          <option value="3">Normal</option>
          <option value="4">Low</option>
        </select>

        <label htmlFor="assignees" className="form-label">Assignees</label>
        <Select
          id="assignees"
          isMulti
          options={workspaceMembers}
          onChange={(selected) =>
            setNewTask({
              ...newTask,
              assignees: selected ? selected.map((opt) => opt.value) : [],
            })
          }
          placeholder="Select Assignees"
          className="form-select"
        />

        <button onClick={handleAddTask} className="submit-button">
          Create Task
        </button>
      </div>
    </div>
  );
};

export default TasksPage;
