import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FoldersPage.css';

const FoldersPage = () => {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [editFolder, setEditFolder] = useState(null); // Track folder being edited
  const [isEditing, setIsEditing] = useState(false); // Edit mode
  const [error, setError] = useState('');

  // Fetch folders for a specific space
  const fetchFolders = async (spaceId) => {
    try {
      const response = await axios.get(`http://localhost:5000/folders/${spaceId}`);
      setFolders(response.data.folders || []);
      setError('');
    } catch (err) {
      console.error('Error fetching folders:', err.response?.data || err.message);
      setError('Failed to fetch folders. Please try again later.');
    }
  };

  // Create a new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Folder name is required.');
      return;
    }

    try {
      const payload = {
        name: newFolderName,
        spaceId,
      };

      const response = await axios.post('http://localhost:5000/create-folder', payload);

      if (response.status === 201) {
        const newFolder = response.data;
        setFolders((prevFolders) => [...prevFolders, newFolder]);
        setNewFolderName('');
        alert('Folder created successfully!');
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (err) {
      console.error('Error creating folder:', err.response?.data || err.message);
      setError('Failed to create folder. Please try again.');
    }
  };

  // Edit folder name
  const handleEditFolder = (folder) => {
    setEditFolder(folder);
    setIsEditing(true);
  };

  const updateFolderName = async () => {
    if (!editFolder.name.trim()) {
      alert('Folder name cannot be empty.');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/folders/${editFolder.id}`, {
        name: editFolder.name,
      });

      setFolders((prevFolders) =>
        prevFolders.map((folder) =>
          folder.id === editFolder.id ? { ...folder, ...response.data } : folder
        )
      );

      setIsEditing(false);
      alert('Folder name updated successfully!');
    } catch (err) {
      console.error('Error updating folder name:', err.response?.data || err.message);
      setError('Failed to update folder name. Please try again.');
    }
  };

  // Delete folder
  const deleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/folders/${folderId}`);
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));
      alert('Folder deleted successfully!');
    } catch (err) {
      console.error('Error deleting folder:', err.response?.data || err.message);
      setError('Failed to delete folder. Please try again.');
    }
  };

  useEffect(() => {
    if (spaceId) {
      fetchFolders(spaceId);
    }
  }, [spaceId]);

  return (
    <div className="folders-page">
      <h1>Folders in Space</h1>
      {error && <p className="error-message">{error}</p>}

      {/* Display Existing Folders */}
      <div className="folders-container">
        {folders.length > 0 ? (
          folders.map((folder) => (
            <div key={folder.id} className="folder-card">
              <h3>{folder.name}</h3>
              <div className="folder-actions">
                <button
                  onClick={() => navigate(`/lists/${folder.id}`)}
                  className="view-lists-button"
                >
                  View Lists
                </button>
                <button
                  onClick={() => handleEditFolder(folder)}
                  className="edit-folder-button"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="delete-folder-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-folders-message">No folders found for this space.</p>
        )}
      </div>

      {/* Create New Folder Section */}
      <div className="create-folder-card">
        <h2>Create New Folder</h2>
        <input
          type="text"
          placeholder="Enter folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          className="input"
        />
        <button onClick={createFolder} className="create-folder-button">
          Create Folder
        </button>
      </div>

      {/* Edit Folder Modal */}
      {isEditing && editFolder && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Folder</h3>
            <input
              type="text"
              value={editFolder.name}
              onChange={(e) => setEditFolder({ ...editFolder, name: e.target.value })}
              className="form-input"
            />
            <button onClick={updateFolderName} className="submit-button">
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

export default FoldersPage;
