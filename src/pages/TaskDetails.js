import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Oval } from 'react-loader-spinner';
import Select from 'react-select'; // For editing assignees
import './TaskDetails.css';

const TaskDetails = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [workspaceMembers, setWorkspaceMembers] = useState([]); // Workspace members for assignee selection
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);

  const priorityMapping = {
    1: 'Urgent',
    2: 'High',
    3: 'Normal',
    4: 'Low',
  };

  useEffect(() => {
    fetchTaskDetails();
    fetchWorkspaceMembers(); // Fetch members for assignees
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:5000/tasks/${taskId}`);
      setTask(response.data);
    } catch (err) {
      console.error('Error fetching task details:', err.message);
      setError('Failed to fetch task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/workspace-members/9012517272');
      setWorkspaceMembers(
        response.data.members.map((member) => ({
          value: member.id,
          label: member.name,
        }))
      );
    } catch (err) {
      console.error('Error fetching workspace members:', err.message);
      setError('Failed to fetch workspace members.');
    }
  };

  const handleEdit = () => {
    setEditedTask({
      ...task,
      assignees: task.assignees.map((assignee) => ({
        value: assignee.id,
        label: assignee.name,
      })),
    });
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    try {
      const updatedTask = {
        ...editedTask,
        assignees: editedTask.assignees.map((assignee) => assignee.value),
      };
      const response = await axios.put(`http://localhost:5000/tasks/${taskId}`, updatedTask);
      setTask(response.data);
      setIsEditing(false);
      alert('Task updated successfully!');
    } catch (err) {
      console.error('Error updating task:', err.message);
      setError('Failed to update the task. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`http://localhost:5000/tasks/${taskId}`);
      alert('Task deleted successfully!');
      navigate(-1);
    } catch (err) {
      console.error('Error deleting task:', err.message);
      setError('Failed to delete the task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <Oval
          height={80}
          width={80}
          color="#4fa94d"
          visible={true}
          ariaLabel="oval-loading"
          secondaryColor="#4fa94d"
          strokeWidth={2}
          strokeWidthSecondary={2}
        />
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!task) {
    return <div>No task details available</div>;
  }

  return (
    <div className="task-details-container">
      {isEditing ? (
        <div className="edit-task-form">
          <h2>Edit Task</h2>
          <label>
            Task Name:
            <input
              type="text"
              value={editedTask.name}
              onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
            />
          </label>
          <label>
            Description:
            <textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            ></textarea>
          </label>
          <label>
            Priority:
            <select
              value={editedTask.priority}
              onChange={(e) => setEditedTask({ ...editedTask, priority: parseInt(e.target.value, 10) })}
            >
              <option value="1">Urgent</option>
              <option value="2">High</option>
              <option value="3">Normal</option>
              <option value="4">Low</option>
            </select>
          </label>
          <label>
            Assignees:
            <Select
              isMulti
              options={workspaceMembers}
              value={editedTask.assignees}
              onChange={(selected) => setEditedTask({ ...editedTask, assignees: selected })}
              placeholder="Select Assignees"
            />
          </label>
          <label>
            Start Date:
            <input
              type="date"
              value={new Date(Number(editedTask.start_date)).toISOString().split('T')[0]}
              onChange={(e) =>
                setEditedTask({ ...editedTask, start_date: new Date(e.target.value).getTime() })
              }
            />
          </label>
          <label>
            Due Date:
            <input
              type="date"
              value={new Date(Number(editedTask.due_date)).toISOString().split('T')[0]}
              onChange={(e) =>
                setEditedTask({ ...editedTask, due_date: new Date(e.target.value).getTime() })
              }
            />
          </label>
          <div className="edit-buttons">
            <button onClick={handleSaveChanges} className="save-button">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1>{task.name}</h1>
          <p>
            <span className="label">Description:</span> {task.description || 'No description provided'}
          </p>
          <p>
            <span className="label">Status:</span> {task.status?.name || 'To Do'}
          </p>
          <p>
            <span className="label">Priority:</span>{' '}
            <span className={`task-priority priority-${task.priority}`}>
              {priorityMapping[task.priority] || 'Unknown'}
            </span>
          </p>
          <p>
            <span className="label">Assignees:</span>{' '}
            {Array.isArray(task.assignees) && task.assignees.length > 0
              ? task.assignees.map((a) => a.name || 'Unknown').join(', ')
              : 'None'}
          </p>
          <p>
            <span className="label">Start Date:</span>{' '}
            {task.start_date ? new Date(Number(task.start_date)).toLocaleDateString() : 'N/A'}
          </p>
          <p>
            <span className="label">Due Date:</span>{' '}
            {task.due_date ? new Date(Number(task.due_date)).toLocaleDateString() : 'N/A'}
          </p>
          <div className="task-actions">
            <button onClick={handleEdit} className="edit-button">
              Edit
            </button>
            <button onClick={handleDelete} className="delete-button">
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TaskDetails;
