import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SpacesPage from './pages/SpacesPage';
import TasksPage from './pages/TasksPage';
import FoldersPage from './pages/FoldersPage';
import ListsPage from './pages/ListsPage';
import SpaceDetailsPage from './components/SpaceDetailsPage';
import TaskDetails from './pages/TaskDetails';
import LoginPage from './pages/LoginPage';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <Sidebar />}
        <div className="content">
          <Routes>
            {/* Login Route */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/spaces/create" /> : <LoginPage onLogin={handleLogin} />
              }
            />

            {/* Protected Routes */}
            {isAuthenticated ? (
              <>
                {/* Route to create a new space */}
                <Route path="/spaces/create" element={<SpacesPage />} />

                {/* Route to create a new folder inside a space */}
                <Route path="/folders/:spaceId/create" element={<FoldersPage />} />

                {/* Route to create a new list inside a folder */}
                <Route path="/lists/:folderId/create" element={<ListsPage />} />

                {/* Route to create tasks inside a specific list */}
                <Route path="/tasks/:listId/create" element={<TasksPage />} />

                {/* Route to view details of a specific space */}
                <Route path="/spaces/:spaceId" element={<SpaceDetailsPage />} />

                {/* Route to handle specific folder selection */}
                <Route path="/folders/:spaceId" element={<FoldersPage />} />

                {/* Route to handle specific list selection */}
                <Route path="/lists/:folderId" element={<ListsPage />} />

                {/* Route to handle viewing tasks of a specific list */}
                <Route path="/tasks/:listId" element={<TasksPage />} />

                {/* Route to view task details */}
                <Route path="/task-details/:taskId" element={<TaskDetails />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
