const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require("os");

const homeDirectory = os.homedir();

let tasks = {
    todo: [],
    doing: [],
    done: []
};

// Load tasks from JSON
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

// Save tasks to JSON
function saveTasks() {
    const homeDirectory = os.homedir();
    const tasksDir = path.join(homeDirectory, '.minotaur');
    const filePath = path.join(tasksDir, 'tasks.json');
    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
}

// Render tasks
function renderTasks() {
    document.getElementById('todo-tasks').innerHTML = '';
    document.getElementById('doing-tasks').innerHTML = '';
    document.getElementById('done-tasks').innerHTML = '';

    tasks.todo.forEach(task => addTaskElement(task, 'todo-tasks'));
    tasks.doing.forEach(task => addTaskElement(task, 'doing-tasks'));
    tasks.done.forEach(task => addTaskElement(task, 'done-tasks'));

    addDragAndDrop();
}

// Add task element
function addTaskElement(task, containerId) {
    const taskContainer = document.getElementById(containerId);
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.draggable = true;
    taskElement.innerText = task.text;
    taskElement.dataset.id = task.id;
    taskContainer.appendChild(taskElement);
}

// Add drag and drop functionality
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

// Get the element after which the task should be inserted
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

// Update tasks array based on the DOM
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

// Add new task
function addTask(column) {
    showTaskModal(column);
}

// Show task modal
function showTaskModal(column) {
    const modal = document.getElementById('task-modal');
    modal.classList.add('is-active');

    const taskInput = document.getElementById('task-input');
    taskInput.value = '';
    taskInput.focus();

    const addTaskBtn = document.getElementById('add-task-btn');
    const cancelTaskBtn = document.getElementById('cancel-task-btn');
    const closeBtn = modal.querySelector('.delete');

    const closeModal = () => {
        modal.classList.remove('is-active');
        addTaskBtn.onclick = null;
        cancelTaskBtn.onclick = null;
        closeBtn.onclick = null;
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
    closeBtn.onclick = closeModal;
}

// Event listeners for adding tasks
document.querySelector('.todo .bx-plus').addEventListener('click', () => addTask('todo'));
document.querySelector('.doing .bx-plus').addEventListener('click', () => addTask('doing'));
document.querySelector('.done .bx-plus').addEventListener('click', () => addTask('done'));

// Initial load
loadTasks();
