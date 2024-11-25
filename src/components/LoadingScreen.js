import React from 'react';
import './LoadingScreen.css'; // Add styles for the loading screen

function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div className="spinner"></div>
            <h1>JetDesk</h1>
        </div>
    );
}

export default LoadingScreen;
