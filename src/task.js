const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require("os");

const homeDirectory = os.homedir();
const configDir = path.join(homeDirectory, '.minotaur');

let savedColorVariables = loadPalette();
let selectedPalette = loadConfig();
selectedPalette = selectedPalette ? selectedPalette.palette : "1";

function loadConfig() {
    const configPath = path.join(configDir, 'config.json');
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading config file:', err);
        return null;
    }
}

function loadPalette() {
    const configPath = path.join(__dirname, "..", "palettes.json");
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(data);
        return config;
    } catch (err) {
        console.error('Error reading palettes file:', err);
        return null;
    }
}

function updateCSSVariables(paletteId) {
    const palette = savedColorVariables[paletteId];
    if (palette) {
        Object.keys(palette).forEach(variable => {
            document.documentElement.style.setProperty(variable, palette[variable]);
        });
        selectedPalette = paletteId;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    updateCSSVariables(selectedPalette);
});

let tasks = {
    todo: [],
    doing: [],
    done: []
};

function loadTasks() {
    const homeDirectory = os.homedir();
    const tasksDir = path.join(homeDirectory, '.minotaur');
    const filePath = path.join(tasksDir, 'tasks.json');
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath);
        tasks = JSON.parse(data);
    }
    renderTasks();
}

function saveTasks() {
    const homeDirectory = os.homedir();
    const tasksDir = path.join(homeDirectory, '.minotaur');
    const filePath = path.join(tasksDir, 'tasks.json');
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
}

function deleteTask(taskId, column) {
    const index = tasks[column].findIndex(task => task.id === taskId);
    if (index !== -1) {
        tasks[column].splice(index, 1);
        renderTasks();
        saveTasks();
    }
}

function renderTasks() {
    document.getElementById('todo-tasks').innerHTML = '';
    document.getElementById('doing-tasks').innerHTML = '';
    document.getElementById('done-tasks').innerHTML = '';

    tasks.todo.forEach(task => addTaskElement(task, 'todo-tasks'));
    tasks.doing.forEach(task => addTaskElement(task, 'doing-tasks'));
    tasks.done.forEach(task => addTaskElement(task, 'done-tasks'));

    addDragAndDrop();
}

function addTaskElement(task, containerId) {
    const taskContainer = document.getElementById(containerId);
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.draggable = true;
    taskElement.innerText = task.text;
    taskElement.dataset.id = task.id;
    taskElement.addEventListener("contextmenu", (e) => {
        let id = taskElement.dataset.id;
        let column = taskContainer.id.split("-");
        column = column[0];
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        ipcRenderer.send("show-context-menu2", x, y, id, column);
    });
    taskContainer.appendChild(taskElement);
}

ipcRenderer.on("delete-task", (e, id, column) => {
    deleteTask(id, column);
});

function addDragAndDrop() {
    const tasks = document.querySelectorAll('.task');
    const columns = document.querySelectorAll('.tasks');

    tasks.forEach(task => {
        task.addEventListener('dragstart', () => {
            task.classList.add('dragging');
        });

        task.addEventListener('dragend', () => {
            task.classList.remove('dragging');
            updateTasks();
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggingTask = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggingTask);
            } else {
                column.insertBefore(draggingTask, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateTasks() {
    tasks.todo = [];
    tasks.doing = [];
    tasks.done = [];

    document.querySelectorAll('#todo-tasks .task').forEach(task => {
        tasks.todo.push({ id: task.dataset.id, text: task.innerText });
    });

    document.querySelectorAll('#doing-tasks .task').forEach(task => {
        tasks.doing.push({ id: task.dataset.id, text: task.innerText });
    });

    document.querySelectorAll('#done-tasks .task').forEach(task => {
        tasks.done.push({ id: task.dataset.id, text: task.innerText });
    });

    saveTasks();
}

function addTask(column) {
    showTaskModal(column);
}

function showTaskModal(column) {
    const modal = document.getElementById('task-modal');
    modal.classList.add('is-active');

    const taskInput = document.getElementById('task-input');
    taskInput.value = '';
    taskInput.focus();

    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');

    const closeModal = () => {
        modal.classList.remove('is-active');
        addTaskBtn.onclick = null;
        cancelTaskBtn.onclick = null;
    };

    addTaskBtn.onclick = () => {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const task = { id: Date.now().toString(), text: taskText };
            tasks[column].push(task);
            renderTasks();
            saveTasks();
            closeModal();
        }
    };
    cancelTaskBtn.onclick = closeModal;
}

document.querySelector('.todo .bx-plus').addEventListener('click', () => addTask('todo'));
document.querySelector('.doing .bx-plus').addEventListener('click', () => addTask('doing'));
document.querySelector('.done .bx-plus').addEventListener('click', () => addTask('done'));

loadTasks();
