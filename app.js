
// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        updateThemeIcon(prefersDark ? 'dark' : 'light');
    }
    
    // Theme toggle event
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
        } else {
            themeIcon.className = 'fas fa-moon';
        }
    }
    
    // App elements
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const taskCategory = document.getElementById('task-category');
    const taskPriority = document.getElementById('task-priority');
    const taskDueDate = document.getElementById('task-due-date');
    const taskDescription = document.getElementById('task-description');
    const taskList = document.getElementById('task-list');
    const categoryItems = document.querySelectorAll('.category-item');
    const filterItems = document.querySelectorAll('.filter-item');
    const searchInput = document.getElementById('search-input');
    const sortBy = document.getElementById('sort-by');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const tasksCounter = document.getElementById('tasks-counter');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    const completionRateElement = document.getElementById('completion-rate');
    const addCategoryBtn = document.getElementById('add-category');
    
    // Modal elements
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const saveTaskBtn = document.getElementById('save-task-btn');
    
    // State
    let tasks = [];
    let currentCategoryFilter = 'all';
    let currentStatusFilter = 'all';
    let currentSortMethod = 'date-added';
    let currentSearchTerm = '';
    let editingTaskId = null;
    
    // Initialize app
    loadTasks();
    updateTasksList();
    updateCategoryCounts();
    updateStatistics();
    
    // Task form submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = taskInput.value.trim();
        if (!title) return;
        
        const currentDate = new Date();
        
        const newTask = {
            id: Date.now(),
            title: title,
            description: taskDescription.value.trim(),
            category: taskCategory.value,
            priority: taskPriority.value,
            dueDate: taskDueDate.value || null,
            completed: false,
            dateAdded: currentDate.toISOString(),
            lastUpdated: currentDate.toISOString()
        };
        
        tasks.push(newTask);
        saveTasks();
        updateTasksList();
        updateCategoryCounts();
        updateStatistics();
        
        // Reset form
        taskForm.reset();
    });
    
    // Set up drag and drop with Sortable
    const sortable = Sortable.create(taskList, {
        handle: '.task-handle',
        animation: 150,
        onEnd: function() {
            // Update tasks array based on new order
            const newTasksOrder = [];
            document.querySelectorAll('.task-item').forEach(item => {
                const taskId = parseInt(item.getAttribute('data-id'), 10);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    newTasksOrder.push(task);
                }
            });
            
            tasks = newTasksOrder;
            saveTasks();
        }
    });
    
    // Category filter click events
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            categoryItems.forEach(cat => cat.classList.remove('active'));
            item.classList.add('active');
            
            currentCategoryFilter = item.getAttribute('data-category');
            updateTasksList();
        });
    });
    
    // Status filter click events
    filterItems.forEach(item => {
        item.addEventListener('click', () => {
            filterItems.forEach(filter => filter.classList.remove('active'));
            item.classList.add('active');
            
            currentStatusFilter = item.getAttribute('data-filter');
            updateTasksList();
        });
    });
    
    // Sort by change event
    sortBy.addEventListener('change', () => {
        currentSortMethod = sortBy.value;
        updateTasksList();
    });
    
    // Search input event
    searchInput.addEventListener('input', () => {
        currentSearchTerm = searchInput.value.trim().toLowerCase();
        updateTasksList();
    });
    
    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        updateTasksList();
        updateCategoryCounts();
        updateStatistics();
    });
    
    // Add new category 
    addCategoryBtn.addEventListener('click', () => {
        const categoryName = prompt('Enter new category name:');
        if (categoryName && categoryName.trim()) {
            const normalizedName = categoryName.trim().toLowerCase().replace(/\s+/g, '-');
            
            // Check if category already exists
            const exists = Array.from(document.querySelectorAll('.category-item'))
                .some(item => item.getAttribute('data-category') === normalizedName);
            
            if (!exists) {
                addNewCategory(normalizedName, categoryName.trim());
                
                // Update category dropdown in the form
                const option = document.createElement('option');
                option.value = normalizedName;
                option.textContent = categoryName.trim();
                taskCategory.appendChild(option);
            } else {
                alert('This category already exists!');
            }
        }
    });
    
    // Modal events
    closeModal.addEventListener('click', () => {
        taskModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });
    
    saveTaskBtn.addEventListener('click', () => {
        if (editingTaskId !== null) {
            const taskIndex = tasks.findIndex(task => task.id === editingTaskId);
            
            if (taskIndex !== -1) {
                const formElements = modalContent.querySelectorAll('input, textarea, select');
                const updatedTask = { ...tasks[taskIndex] };
                
                formElements.forEach(element => {
                    const field = element.getAttribute('name');
                    if (field) {
                        if (field === 'completed') {
                            updatedTask[field] = element.checked;
                        } else {
                            updatedTask[field] = element.value;
                        }
                    }
                });
                
                updatedTask.lastUpdated = new Date().toISOString();
                tasks[taskIndex] = updatedTask;
                saveTasks();
                updateTasksList();
                updateCategoryCounts();
                updateStatistics();
                
                taskModal.style.display = 'none';
            }
        }
    });
    
    // Task interaction functions
    function openTaskDetails(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        
        editingTaskId = taskId;
        
        modalTitle.textContent = 'Edit Task';
        
        modalContent.innerHTML = `
            <form class="modal-form">
                <div class="form-group">
                    <label for="modal-title-input">Title</label>
                    <input type="text" id="modal-title-input" name="title" value="${escapeHtml(task.title)}" required>
                </div>
                
                <div class="form-group">
                    <label for="modal-description">Description</label>
                    <textarea id="modal-description" name="description" rows="4">${escapeHtml(task.description || '')}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-category">Category</label>
                        <select id="modal-category" name="category">
                            ${getCategoryOptions(task.category)}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="modal-priority">Priority</label>
                        <select id="modal-priority" name="priority">
                            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                            <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-due-date">Due Date</label>
                        <input type="date" id="modal-due-date" name="dueDate" value="${task.dueDate || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="modal-completed">
                            <input type="checkbox" id="modal-completed" name="completed" ${task.completed ? 'checked' : ''}>
                            Mark as completed
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <p>Added: ${formatDate(task.dateAdded)}</p>
                    <p>Last Updated: ${formatDate(task.lastUpdated)}</p>
                </div>
            </form>
        `;
        
        taskModal.style.display = 'flex';
    }
    
    function deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            updateTasksList();
            updateCategoryCounts();
            updateStatistics();
        }
    }
    
    function toggleTaskStatus(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            tasks[taskIndex].lastUpdated = new Date().toISOString();
            saveTasks();
            updateTasksList();
            updateCategoryCounts();
            updateStatistics();
        }
    }
    
    // Helper functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function getCategoryOptions(selectedCategory) {
        const categories = [];
        
        // Add default categories
        categories.push('work', 'personal', 'shopping');
        
        // Add custom categories from sidebar
        document.querySelectorAll('.category-item').forEach(item => {
            const category = item.getAttribute('data-category');
            if (category !== 'all' && !categories.includes(category)) {
                categories.push(category);
            }
        });
        
        return categories.map(category => {
            const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
            return `<option value="${category}" ${category === selectedCategory ? 'selected' : ''}>${displayName}</option>`;
        }).join('');
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        return date.toLocaleString();
    }
    
    function formatDueDate(dateString) {
        if (!dateString) return '';
        
        const dueDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const isOverdue = dueDate < today && dueDate.toDateString() !== today.toDateString();
        
        let formattedDate = dueDate.toLocaleDateString();
        
        if (dueDate.toDateString() === today.toDateString()) {
            formattedDate = 'Today';
        } else if (dueDate.toDateString() === tomorrow.toDateString()) {
            formattedDate = 'Tomorrow';
        } else if (dueDate.toDateString() === yesterday.toDateString()) {
            formattedDate = 'Yesterday';
        }
        
        return `<div class="due-date ${isOverdue ? 'overdue' : ''}">
                    <i class="far fa-calendar-alt"></i> 
                    ${formattedDate}
                </div>`;
    }
    
    function addNewCategory(categoryId, displayName) {
        const categoryList = document.querySelector('.category-list');
        const iconClass = getIconForCategory(categoryId);
        
        const newCategory = document.createElement('li');
        newCategory.className = 'category-item';
        newCategory.setAttribute('data-category', categoryId);
        newCategory.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${displayName}</span>
            <span class="count">0</span>
        `;
        
        newCategory.addEventListener('click', () => {
            categoryItems.forEach(cat => cat.classList.remove('active'));
            newCategory.classList.add('active');
            
            currentCategoryFilter = categoryId;
            updateTasksList();
        });
        
        categoryList.appendChild(newCategory);
        updateCategoryCounts();
    }
    
    function getIconForCategory(category) {
        const icons = {
            'work': 'fas fa-briefcase',
            'personal': 'fas fa-user',
            'shopping': 'fas fa-shopping-cart',
            'health': 'fas fa-heartbeat',
            'finance': 'fas fa-money-bill-wave',
            'education': 'fas fa-graduation-cap',
            'home': 'fas fa-home',
            'travel': 'fas fa-plane'
        };
        
        return icons[category] || 'fas fa-tag';
    }
    
    function updateTasksList() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks;
        
        // Apply search filter
        if (currentSearchTerm) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(currentSearchTerm) ||
                (task.description && task.description.toLowerCase().includes(currentSearchTerm))
            );
        }
        
        // Apply category filter
        if (currentCategoryFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategoryFilter);
        }
        
        // Apply status filter
        if (currentStatusFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentStatusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (currentStatusFilter === 'high-priority') {
            filteredTasks = filteredTasks.filter(task => task.priority === 'high');
        } else if (currentStatusFilter === 'due-today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            });
        }
        
        // Apply sorting
        filteredTasks = sortTasks(filteredTasks, currentSortMethod);
        
        // Render filtered tasks
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.className = 'task-item';
            taskElement.setAttribute('data-id', task.id);
            
            if (task.completed) {
                taskElement.classList.add('completed');
            }
            
            taskElement.innerHTML = `
                <i class="fas fa-grip-vertical task-handle"></i>
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <div class="task-date">Added: ${formatDate(task.dateAdded)}</div>
                    <div class="task-meta">
                        <span class="task-tag task-category" data-category="${task.category}">
                            ${getCategoryDisplayName(task.category)}
                        </span>
                        <span class="task-tag task-priority" data-priority="${task.priority}">
                            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        ${task.dueDate ? formatDueDate(task.dueDate) : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            // Add event listeners
            const checkbox = taskElement.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
            
            const taskContent = taskElement.querySelector('.task-content');
            taskContent.addEventListener('click', () => openTaskDetails(task.id));
            
            const editBtn = taskElement.querySelector('.edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openTaskDetails(task.id);
            });
            
            const deleteBtn = taskElement.querySelector('.delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });
            
            taskList.appendChild(taskElement);
        });
        
        // Update task counter
        const activeTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
    }
    
    function getCategoryDisplayName(category) {
        return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }
    
    function sortTasks(tasksArray, sortMethod) {
        return [...tasksArray].sort((a, b) => {
            switch (sortMethod) {
                case 'date-added':
                    return new Date(b.dateAdded) - new Date(a.dateAdded);
                case 'due-date':
                    // Put tasks without due dates at the end
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityValues = { high: 3, medium: 2, low: 1 }; 
                    return priorityValues[b.priority] - priorityValues[a.priority];
                default:
                    return 0;
            }
        });
    }
    
    function updateCategoryCounts() {
        document.querySelectorAll('.category-item').forEach(item => {
            const category = item.getAttribute('data-category');
            const countElement = item.querySelector('.count');
            
            let count;
            if (category === 'all') {
                count = tasks.length;
            } else {
                count = tasks.filter(task => task.category === category).length;
            }
            
            countElement.textContent = count;
        });
    }
    
    function updateStatistics() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        totalTasksElement.textContent = totalTasks;
        completedTasksElement.textContent = completedTasks;
        completionRateElement.textContent = `${completionRate}%`;
    }
    
    // Local Storage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    }
});