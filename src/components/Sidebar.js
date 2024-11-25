import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFolderPlus, faTasks, faBars } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

function Sidebar() {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [folders, setFolders] = useState([]);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedList, setSelectedList] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSpaces();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible((prev) => !prev);
  };

  const fetchSpaces = async () => {
    try {
      const response = await fetch('http://localhost:5000/spaces/9012517272');
      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (error) {
      console.error('Error fetching spaces:', error.message);
    }
  };

  const fetchFolders = async (spaceId) => {
    try {
      const response = await fetch(`http://localhost:5000/folders/${spaceId}`);
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (error) {
      console.error('Error fetching folders:', error.message);
    }
  };

  const fetchLists = async (folderId) => {
    try {
      const response = await fetch(`http://localhost:5000/lists/${folderId}`);
      const data = await response.json();
      setLists(data.lists || []);
    } catch (error) {
      console.error('Error fetching lists:', error.message);
    }
  };

  const fetchTasks = async (listId) => {
    try {
      const response = await fetch(`http://localhost:5000/lists/${listId}/tasks`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
    }
  };

  const handleSpaceSelection = (space) => {
    setSelectedSpace(space);
    setSelectedFolder(null);
    setSelectedList(null);
    setTasks([]);
    fetchFolders(space.id);
    navigate(`/folders/${space.id}`);
  };

  const handleFolderSelection = (folder) => {
    setSelectedFolder(folder);
    setSelectedList(null);
    setTasks([]);
    fetchLists(folder.id);
    navigate(`/lists/${folder.id}`);
  };

  const handleListSelection = (list) => {
    setSelectedList(list);
    fetchTasks(list.id);
    navigate(`/tasks/${list.id}`);
  };

  const handleTaskClick = (task) => {
    navigate(`/task-details/${task.id}`, { state: { task } });
  };

  return (
    <div>
      {/* Sidebar Toggle Button */}
      <button className="toggle-button" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}>
        <h2 className="sidebar-title">JetDesk</h2>

        {/* Spaces Section */}
        <SidebarSection
          title="Spaces"
          items={spaces}
          onAdd={() => navigate('/spaces/create')}
          onItemClick={handleSpaceSelection}
          isSelected={(item) => selectedSpace?.id === item.id}
        />

        {/* Folders Section */}
        {selectedSpace && (
          <SidebarSection
            title="Folders"
            items={folders}
            onAdd={() => navigate(`/folders/${selectedSpace.id}/create`)}
            onItemClick={handleFolderSelection}
            isSelected={(item) => selectedFolder?.id === item.id}
          />
        )}

        {/* Lists Section */}
        {selectedFolder && (
          <SidebarSection
            title="Lists"
            items={lists}
            onAdd={() => navigate(`/lists/${selectedFolder.id}/create`)}
            onItemClick={handleListSelection}
            isSelected={(item) => selectedList?.id === item.id}
          />
        )}

        {/* Tasks Section */}
        {selectedList && (
          <SidebarSection
            title="Tasks"
            items={tasks}
            onAdd={() => navigate(`/tasks/${selectedList.id}/create`)}
            onItemClick={handleTaskClick}
            isSelected={() => false}
          />
        )}
      </div>
    </div>
  );
}

const SidebarSection = ({ title, items, onAdd, onItemClick, isSelected }) => (
  <div className={`${title.toLowerCase()}-header`}>
    <h3>{title}</h3>
    <FontAwesomeIcon
      icon={faPlus}
      className="add-icon"
      title={`Add ${title}`}
      onClick={onAdd}
    />
    <ul className="horizontal-list">
      {items.map((item) => (
        <li
          key={item.id}
          className={isSelected(item) ? 'active' : ''}
          onClick={() => onItemClick(item)}
        >
          <Link to="#">{item.name}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Sidebar;
