import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SpacesPage.css';

const SpacesPage = () => {
  const [spaceName, setSpaceName] = useState('');
  const [spaces, setSpaces] = useState([]);
  const [editSpace, setEditSpace] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await axios.get('http://localhost:5000/spaces/9012517272');
      setSpaces(response.data.spaces || []);
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  };

  const createSpace = async () => {
    if (!spaceName.trim()) {
      alert('Space name is required.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/create-space', {
        name: spaceName,
        teamId: '9012517272',
      });

      const newSpace = response.data;
      setSpaces((prevSpaces) => [...prevSpaces, newSpace]);

      alert('Space created successfully!');
      setSpaceName('');
    } catch (error) {
      console.error('Error creating space:', error.response?.data || error.message);
      alert('Failed to create space. Please try again.');
    }
  };

  const handleEditClick = (space) => {
    setEditSpace(space);
    setIsEditModalVisible(true);
  };

  const handleUpdateSpace = async () => {
    if (!editSpace.name.trim()) {
      alert('Space name cannot be empty.');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5000/spaces/${editSpace.id}`, {
        name: editSpace.name,
      });

      setSpaces((prevSpaces) =>
        prevSpaces.map((space) =>
          space.id === editSpace.id ? { ...space, ...response.data } : space
        )
      );

      setIsEditModalVisible(false);
      alert('Space updated successfully!');
    } catch (error) {
      console.error('Error updating space:', error.response?.data || error.message);
      alert('Failed to update space. Please try again.');
    }
  };

  const handleDeleteSpace = async (spaceId) => {
    if (!window.confirm('Are you sure you want to delete this space?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/spaces/${spaceId}`);
      setSpaces((prevSpaces) => prevSpaces.filter((space) => space.id !== spaceId));
      alert('Space deleted successfully!');
    } catch (error) {
      console.error('Error deleting space:', error.response?.data || error.message);
      alert('Failed to delete space. Please try again.');
    }
  };

  return (
    <div className="space-page">
      <h1>Your Spaces</h1>

      {/* Input Section */}
      <div className="create-space-section">
        <input
          type="text"
          placeholder="Enter a new space name"
          value={spaceName}
          onChange={(e) => setSpaceName(e.target.value)}
          className="input"
        />
        <button onClick={createSpace} className="button">
          Create Space
        </button>
      </div>

      {/* Display Spaces in a Card Layout */}
      <div className="spaces-container">
        {spaces.map((space) => (
          <div key={space.id} className="space-card">
            <div className="space-header">
              <h3>{space.name}</h3>
            </div>
            <div className="space-body">
              <p>Team ID: {space.teamId}</p>
            </div>
            <div className="space-footer">
              <button className="edit-button" onClick={() => handleEditClick(space)}>
                Edit
              </button>
              <button
                className="delete-button"
                onClick={() => handleDeleteSpace(space.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditModalVisible && editSpace && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Space</h3>
            <input
              type="text"
              value={editSpace.name}
              onChange={(e) => setEditSpace({ ...editSpace, name: e.target.value })}
              className="form-input"
            />
            <button onClick={handleUpdateSpace} className="submit-button">
              Save Changes
            </button>
            <button onClick={() => setIsEditModalVisible(false)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacesPage;
