import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

// Register required components
ChartJS.register(ArcElement, Tooltip, Legend);

function TaskPriorityChart({ tasksByPriority }) {
    const data = {
        labels: ['Low', 'Medium', 'High', 'Urgent'],
        datasets: [
            {
                label: 'Task Priority',
                data: [
                    tasksByPriority.low || 0,
                    tasksByPriority.medium || 0,
                    tasksByPriority.high || 0,
                    tasksByPriority.urgent || 0,
                ],
                backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9c27b0'],
            },
        ],
    };

    return (
        <div>
            <h3>Task Priority Distribution</h3>
            <Pie data={data} />
        </div>
    );
}

export default TaskPriorityChart;
