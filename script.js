document.addEventListener('DOMContentLoaded', () => {
    loadTimetable();
    const addRowBtn = document.getElementById('addRowBtn');
    if (addRowBtn) addRowBtn.addEventListener('click', addRow);
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveTimetable);
    const loadDayBtn = document.getElementById('loadDayBtn');
    if (loadDayBtn) loadDayBtn.addEventListener('click', loadTimetable);
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearDayTimetable);
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllTimetables);
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportTimetable);
    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.addEventListener('change', importTimetable);
    const filterTaskInput = document.getElementById('filterTask');
    if (filterTaskInput) filterTaskInput.addEventListener('input', filterTasks);
    const sortTimeBtn = document.getElementById('sortTimeBtn');
    if (sortTimeBtn) sortTimeBtn.addEventListener('click', sortTimetableByTime);
    const sortTaskBtn = document.getElementById('sortTaskBtn');
    if (sortTaskBtn) sortTaskBtn.addEventListener('click', sortTimetableByTask);
    const daySelect = document.getElementById('daySelect');
    if (daySelect) daySelect.addEventListener('change', loadTimetable);

    // Call setNotifications when the document loads
    setNotifications();
});

let timetableData = {}; // Store timetable data in a variable
const daySelectElement = document.getElementById('daySelect');
const taskTableBody = document.getElementById('taskTableBody');
const filterTaskInput = document.getElementById('filterTask');

// Get the current day of the week
function getCurrentDay() {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayIndex = new Date().getDay();
    return daysOfWeek[currentDayIndex];
}

function importTimetable(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const importedData = JSON.parse(e.target.result);
                localStorage.setItem('timetableData', JSON.stringify(importedData));
                timetableData = importedData; // Update the global variable
                const dayKeys = Object.keys(importedData);
                if (dayKeys.length >= 0) {
                    const currentDay = getCurrentDay();
                    const dayToDisplay = dayKeys.includes(currentDay) ? currentDay : dayKeys[0];
                    if (daySelectElement) {
                        daySelectElement.innerHTML = "";
                        dayKeys.forEach(day => {
                            const option = document.createElement("option");
                            option.value = day;
                            option.textContent = day;
                            daySelectElement.appendChild(option);
                        });
                        daySelectElement.value = dayToDisplay;
                    }
                    loadTimetable();
                    showMessage("Timetable imported and displayed successfully!");
                } else {
                    if (taskTableBody) {
                        taskTableBody.innerHTML = '';
                    }
                    showMessage("Imported file is empty.");
                }
            } catch (error) {
                console.error("Error parsing JSON:", error);
                showMessage("Failed to import timetable. Invalid JSON format.");
            }
        };
        reader.readAsText(file);
    }
}

function addRow(time = "", task = "", alarm = false, completed = false, image = "") {
    if (!taskTableBody) {
        console.error("Error: taskTableBody element not found.");
        showMessage("Error: Timetable table body not found. Please check your HTML.");
        return;
    }
    const row = taskTableBody.insertRow();
    row.innerHTML = `
        <td><input type="time" value="${time}"></td>
        <td>
            <input type="text" value="${task}">
            ${image ? `<img src="${image}" class="task-img" width="50" height="50">` : ''}
        </td>
        <td><input type="checkbox" ${alarm ? 'checked' : ''}></td>
        <td><input type="checkbox" ${completed ? 'checked' : ''}></td>
        <td>
            <input type="file" accept="image/*" style="display:none;">
            <button class="upload-image-btn">Upload</button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </td>
    `;
    const uploadButton = row.querySelector('.upload-image-btn');
    const imageInput = row.querySelector('input[type="file"]');
    const deleteButton = row.querySelector('.delete-btn');
    const taskInput = row.cells[1].querySelector('input[type="text"]');
    
    uploadButton.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = document.createElement("img");
                img.src = reader.result;
                img.classList.add("task-img");
                img.width = 50;
                img.height = 50;
                row.cells[1].appendChild(img);
                saveTimetable();
            };
            reader.readAsDataURL(file);
        }
    });

    deleteButton.addEventListener('click', () => {
        row.remove();
        saveTimetable();
    });

    taskInput.addEventListener('input', () => {
        saveTimetable();
    });
    
    const timeInput = row.cells[0].querySelector('input[type="time"]');
    timeInput.addEventListener('change', () => {
        saveTimetable();
    });

    const alarmCheckbox = row.cells[2].querySelector('input[type="checkbox"]');
    alarmCheckbox.addEventListener('change', () => {
        saveTimetable();
    });

    const completedCheckbox = row.cells[3].querySelector('input[type="checkbox"]');
    completedCheckbox.addEventListener('change', () => {
        saveTimetable();
    });
}

function saveTimetable() {
    const selectedDay = daySelectElement?.value || getCurrentDay();
    timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};
    timetableData[selectedDay] = [];
    
    const rows = document.querySelectorAll('#taskTableBody tr');
    rows.forEach(row => {
        const time = row.cells[0].querySelector('input[type="time"]').value;
        const task = row.cells[1].querySelector('input[type="text"]').value;
        const alarm = row.cells[2].querySelector('input[type="checkbox"]').checked;
        const completed = row.cells[3].querySelector('input[type="checkbox"]').checked;
        const imgElement = row.cells[1].querySelector('.task-img');
        const image = imgElement ? imgElement.src : "";
        timetableData[selectedDay].push({ time, task, alarm, completed, image });
    });
    
    localStorage.setItem('timetableData', JSON.stringify(timetableData));
    showMessage("Timetable saved successfully!");
    setNotifications(); // Update notifications when saving
}

function loadTimetable() {
    const selectedDay = daySelectElement?.value || getCurrentDay();
    timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};
    const dayTimetable = timetableData[selectedDay] || [];
    
    if (taskTableBody) {
        taskTableBody.innerHTML = '';
        dayTimetable.forEach(data => addRow(data.time, data.task, data.alarm, data.completed, data.image));
    } else {
        console.error("Error: taskTableBody element not found.");
        showMessage("Error: Timetable table body not found. Please check your HTML.");
    }

    setNotifications();  // Update notifications after loading timetable
}

function clearDayTimetable() {
    const selectedDay = daySelectElement?.value || getCurrentDay();
    timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};
    delete timetableData[selectedDay];
    localStorage.setItem('timetableData', JSON.stringify(timetableData));
    
    if (taskTableBody) {
        taskTableBody.innerHTML = '';
    } else {
        console.error("Error: taskTableBody element not found.");
        showMessage("Error: Timetable table body not found. Please check your HTML.");
    }
    
    showMessage(`Timetable for ${selectedDay} cleared!`);
    setNotifications(); // Clear notifications when clearing
}

function clearAllTimetables() {
    const confirmation = confirm("Are you sure you want to clear all timetables?");
    if (!confirmation) return;

    localStorage.removeItem('timetableData');
    timetableData = {};
    if (taskTableBody) {
        taskTableBody.innerHTML = '';
    } else {
        console.error("Error: taskTableBody element not found.");
        showMessage("Error: Timetable table body not found. Please check your HTML.");
    }
    showMessage('All timetables cleared!');
    setNotifications(); // Clear notifications when clearing all
}

function exportTimetable() {
    if (!timetableData || Object.keys(timetableData).length === 0) {
        showMessage('No timetable data to export!');
        return;
    }

    try {
        const blob = new Blob([JSON.stringify(timetableData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showMessage('Timetable exported successfully!');
    } catch (error) {
        console.error("Error exporting data:", error);
        showMessage('Error exporting timetable data.');
    }
}

function filterTasks() {
    const filterText = filterTaskInput?.value.toLowerCase() || "";
    const rows = document.querySelectorAll('#taskTableBody tr');
    let matchingTasksFound = false;

    rows.forEach(row => {
        const taskText = row.cells[1].querySelector('input').value.toLowerCase();
        const display = taskText.includes(filterText) ? '' : 'none';
        row.style.display = display;
        if (display === '') {
            matchingTasksFound = true;
        }
    });

    if (!matchingTasksFound) {
        showMessage('No matching tasks found.');
    }
}

function sortTimetableByTime() {
    if (!taskTableBody) return;
    const rows = Array.from(taskTableBody.rows);

    rows.sort((a, b) => {
        const timeA = a.cells[0].querySelector('input').value;
        const timeB = b.cells[0].querySelector('input').value;
        return timeA.localeCompare(timeB);
    });

    taskTableBody.innerHTML = '';
    rows.forEach(row => taskTableBody.appendChild(row));
    saveTimetable();
}

function sortTimetableByTask() {
    if (!taskTableBody) return;
    const rows = Array.from(taskTableBody.rows);

    rows.sort((a, b) => {
        const taskA = a.cells[1].querySelector('input').value.toLowerCase();
        const taskB = b.cells[1].querySelector('input').value.toLowerCase();
        return taskA.localeCompare(taskB);
    });

    taskTableBody.innerHTML = '';
    rows.forEach(row => taskTableBody.appendChild(row));
    saveTimetable();
}

function showMessage(message) {
    const messageContainer = document.createElement("div");
    messageContainer.textContent = message;
    messageContainer.className = "message";
    document.body.appendChild(messageContainer);
    setTimeout(() => messageContainer.remove(), 3000);
}

function setNotifications() {
    const selectedDay = daySelectElement?.value || getCurrentDay();
    timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};
    const dayTimetable = timetableData[selectedDay] || [];

    // Clear any existing timeouts
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notificationTimeoutId_')) {
            const timeoutId = localStorage.getItem(key);
            clearTimeout(timeoutId);
            localStorage.removeItem(key);
        }
    }

    dayTimetable.forEach((task, index) => {
        if (task.alarm) {
            const taskTime = task.time;
            const taskText = task.task;

            if (taskTime) {
                const now = new Date();
                const [hours, minutes] = taskTime.split(':').map(Number);
                const taskDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);

                // Notify when the task time is reached
                const timeUntilTask = taskDateTime.getTime() - now.getTime();
                
                // Schedule notification for a future task
                if (timeUntilTask > 0) {
                    const timeoutId = setTimeout(() => {
                        showNotification(taskText, taskTime, index);
                    }, timeUntilTask); // Set the timeout for the scheduled task

                    // Store the timeout ID in localStorage so it can be cleared later
                    localStorage.setItem(`notificationTimeoutId_${index}`, timeoutId);
                }
            }
        }
    });
}

function showNotification(taskText, taskTime, index) {
    // Check if browser supports notifications
    if (Notification.permission === "granted") {
        const notification = new Notification(`Task Reminder`, {
            body: `Task: "${taskText}" is due at ${taskTime}! Are you ready?`,
            icon: 'icon.png' // Optional: Path to an icon for the notification
        });

        // Handle user response directly when the notification is shown
        notification.onclick = function () {
            let userResponse = confirm('Are you ready for this task? Type "Yes" to stop the alarm or "No" to extend it by 5 minutes.');
            if (userResponse) {
                // User is ready
                stopAlarmForTask(index);
            } else {
                // User is not ready, extend task by 5 minutes
                extendTaskTime(index);
            }

            // Close the notification
            notification.close();
        };

        playSound(); // Play alarm sound when notification is called
    } else if (Notification.permission === "default") {
        // Request permission to show notifications
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                const notification = new Notification(`Task Reminder`, {
                    body: `Task: "${taskText}" is due at ${taskTime}! Are you ready?`,
                    icon: 'icon.png' // Optional
                });

                // Handle user response directly when the notification is shown
                notification.onclick = function () {
                    let userResponse = confirm('Are you ready for this task? Type "Yes" to stop the alarm or "No" to extend it by 5 minutes.');
                    if (userResponse) {
                        stopAlarmForTask(index);
                    } else {
                        extendTaskTime(index);
                    }

                    // Close the notification
                    notification.close();
                };

                playSound(); // Play alarm sound when notification is called
            }
        });
    }
}

function stopAlarmForTask(index) {
    // Stop the alarm for the particular task
    console.log(`Alarm stopped for task index: ${index}`);
    // Mark this task as completed or ongoing in your localStorage or display a message
}

// Extend the due time for this task by 5 minutes if the user selects "No"
function extendTaskTime(index) {
    timetableData = JSON.parse(localStorage.getItem('timetableData')) || {};
    const selectedDay = daySelectElement?.value || getCurrentDay();
    const dayTimetable = timetableData[selectedDay] || [];
    
    if (dayTimetable[index]) {
        const task = dayTimetable[index];
        const [hour, minute] = task.time.split(':');
        const newDate = new Date();
        newDate.setHours(parseInt(hour));
        newDate.setMinutes(parseInt(minute) + 5); // Adding 5 minutes

        task.time = newDate.toTimeString().slice(0, 5); // Format back to HH:MM
        showMessage(`Task "${task.task}" extended to ${task.time}`);
        saveTimetable(); // Save updated timetable
    }
}

function playSound() {
    const audio = new Audio('Text_Message_Sounds_mp3_1702339018.mp3'); // Path to your audio file
    audio.play().catch(error => {
        console.error("Failed to play sound:", error);
        showMessage("Failed to play notification sound.");
    });
}
