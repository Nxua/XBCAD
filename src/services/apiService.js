export const fetchSpaces = async () => {
    const response = await fetch('http://localhost:5000/spaces/9012517272');
    return response.json();
};

export const fetchFolders = async (spaceId) => {
    const response = await fetch(`http://localhost:5000/folders/${spaceId}`);
    return response.json();
};

export const fetchLists = async (folderId) => {
    const response = await fetch(`http://localhost:5000/lists/${folderId}`);
    return response.json();
};

export const fetchTasks = async (listId) => {
    const response = await fetch(`http://localhost:5000/lists/${listId}/tasks`);
    return response.json();
};

export const fetchTaskDetails = async (taskId) => {
    const response = await fetch(`http://localhost:5000/tasks/${taskId}`);
    return response.json();
};
