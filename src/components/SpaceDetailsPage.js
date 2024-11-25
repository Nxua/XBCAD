import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';


const SpaceDetailsPage = () => {
  const { spaceId } = useParams(); // Get spaceId from the URL
  const [folders, setFolders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders(spaceId);
  }, [spaceId]);

  const fetchFolders = async (spaceId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/folders/${spaceId}`);
      setFolders(response.data.folders || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching folders:', error.message);
      setLoading(false);
    }
  };

  const fetchTasks = async (folderId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/lists/${folderId}/tasks`);
      setTasks(response.data.tasks || []);
      setSelectedFolder(folderId);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-details">
      <h1>Folders and Tasks</h1>

      {/* Folders Section */}
      <div className="folders-container">
        {loading ? (
          <p>Loading folders...</p>
        ) : folders.length > 0 ? (
          folders.map((folder) => (
            <div key={folder.id} className="folder-card" onClick={() => fetchTasks(folder.id)}>
              <h3>{folder.name}</h3>
              <p>Click to view tasks</p>
            </div>
          ))
        ) : (
          <p>No folders found for this space.</p>
        )}
      </div>

      {/* Tasks Section */}
      {selectedFolder && (
        <>
          <h2>Tasks in Folder: {selectedFolder}</h2>
          <div className="tasks-container">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div key={task.id} className="task-card">
                  <h4>{task.name}</h4>
                  <p>{task.description || 'No description available.'}</p>
                </div>
              ))
            ) : (
              <p>No tasks available in this folder.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SpaceDetailsPage;
