import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ListsPage.css';

const ListsPage = () => {
  const { folderId } = useParams(); // Get folderId from the URL
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [editList, setEditList] = useState(null); // Track list being edited
  const [creating, setCreating] = useState(false); // Tracks creation state
  const [isEditing, setIsEditing] = useState(false); // Edit mode
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLists(folderId);
  }, [folderId]);

  const fetchLists = async (folderId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/lists/${folderId}`);
      setLists(response.data.lists || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching lists:', error.message);
      setError('Failed to load lists. Please try again later.');
      setLoading(false);
    }
  };

  const createNewList = async () => {
    if (!newListName.trim()) {
      alert('List name is required!');
      return;
    }

    try {
      setCreating(true);
      const response = await axios.post(`http://localhost:5000/create-list`, {
        name: newListName,
        folderId,
      });

      const newList = response.data;
      setLists((prevLists) => [...prevLists, newList]);
      setNewListName('');
      setCreating(false);
      alert('List created successfully!');
    } catch (error) {
      console.error('Error creating list:', error.message);
      setError('Failed to create the list. Please try again.');
      setCreating(false);
    }
  };

  const handleEditList = (list) => {
    setEditList(list);
    setIsEditing(true);
  };

  const updateListName = async () => {
    if (!editList.name.trim()) {
      alert('List name cannot be empty.');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/lists/${editList.id}`, {
        name: editList.name,
      });

      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === editList.id ? { ...list, ...response.data } : list
        )
      );
      setIsEditing(false);
      alert('List name updated successfully!');
    } catch (error) {
      console.error('Error updating list name:', error.message);
      setError('Failed to update the list. Please try again.');
    }
  };

  const deleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this list?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/lists/${listId}`);
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));
      alert('List deleted successfully!');
    } catch (error) {
      console.error('Error deleting list:', error.message);
      setError('Failed to delete the list. Please try again.');
    }
  };

  return (
    <div className="lists-page">
      <h1>Lists in Folder</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Create New List Section */}
      <div className="create-list-card">
        <h2>Create New List</h2>
        <input
          type="text"
          placeholder="Enter new list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          className="create-list-input"
        />
        <button
          onClick={createNewList}
          className="create-list-button"
          disabled={creating}
        >
          {creating ? 'Creating...' : 'Create List'}
        </button>
      </div>

      {/* Lists Display Section */}
      {loading ? (
        <p className="loading-message">Loading lists...</p>
      ) : lists.length > 0 ? (
        <div className="lists-container">
          {lists.map((list) => (
            <div key={list.id} className="list-card">
              <h3>{list.name}</h3>
              <p>{list.description || 'No description available'}</p>
              <div className="list-actions">
                <button
                  onClick={() => handleEditList(list)}
                  className="edit-list-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteList(list.id)}
                  className="delete-list-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-lists-message">No lists found for this folder.</p>
      )}

      {/* Edit List Modal */}
      {isEditing && editList && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit List</h3>
            <input
              type="text"
              value={editList.name}
              onChange={(e) => setEditList({ ...editList, name: e.target.value })}
              className="form-input"
            />
            <button onClick={updateListName} className="submit-button">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListsPage;
