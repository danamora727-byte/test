// LocalStorage Key
const STORAGE_KEY = 'admin_panel_users';

// Initial Seed Data
const initialUsers = [
    { id: 1, name: 'Jane Doe', email: 'jane@example.com', created_at: '2025-01-10T09:30:00Z' },
    { id: 2, name: 'Alex Smith', email: 'alex@example.com', created_at: '2025-01-12T14:15:00Z' }
];

// Data Helper Functions
function getUsers() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialUsers));
        return initialUsers;
    }
    return JSON.parse(data);
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getNextId(users) {
    if (users.length === 0) return 1;
    return Math.max(...users.map(u => u.id)) + 1;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// Escaping for Security
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ---------------- DASHBOARD LOGIC (index.html) ----------------
function initDashboard() {
    const users = getUsers();
    renderStats(users.length);
    renderAlert();
    renderTable(users);

    // Live Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = users.filter(u => 
                u.name.toLowerCase().includes(query) || 
                u.email.toLowerCase().includes(query) ||
                String(u.id).includes(query)
            );
            renderTable(filtered);
        });
    }
}

function renderStats(total) {
    const totalElem = document.getElementById('totalUsers');
    if (totalElem) totalElem.textContent = total;
}

function renderAlert() {
    const container = document.getElementById('alertContainer');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const msg = params.get('msg');

    if (!msg) return;

    let text = '';
    let type = 'success';

    if (msg === 'created') text = 'User added successfully!';
    else if (msg === 'updated') text = 'User updated successfully!';
    else if (msg === 'deleted') text = 'User deleted successfully!';
    else if (msg === 'error') { text = 'An error occurred.'; type = 'error'; }

    if (text) {
        container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(text)}</div>`;
        // Clean URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function renderTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">No records found in database.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td class="text-muted">#${user.id}</td>
            <td class="font-weight-medium">${escapeHtml(user.name)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td class="text-muted">${formatDate(user.created_at)}</td>
            <td class="text-right">
                <a href="update.html?id=${user.id}" class="btn-action btn-edit">Edit</a>
                <button onclick="deleteUser(${user.id})" class="btn-action btn-delete">Delete</button>
            </td>
        </tr>
    `).join('');
}

function deleteUser(id) {
    if (!confirm('Delete this record?')) return;
    
    let users = getUsers();
    users = users.filter(u => u.id !== id);
    saveUsers(users);
    
    window.location.href = 'index.html?msg=deleted';
}

// ---------------- CREATE USER LOGIC (create.html) ----------------
function initCreateUser() {
    const form = document.getElementById('createForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const errors = [];

        if (!name) errors.push("Name is required.");
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("A valid email address is required.");
        }

        const alertContainer = document.getElementById('alertContainer');
        if (errors.length > 0) {
            alertContainer.innerHTML = `
                <div class="alert alert-error">
                    ${errors.map(err => `<p>${escapeHtml(err)}</p>`).join('')}
                </div>
            `;
            return;
        }

        const users = getUsers();
        const newUser = {
            id: getNextId(users),
            name: name,
            email: email,
            created_at: new Date().toISOString()
        };

        users.unshift(newUser); // add to top
        saveUsers(users);

        window.location.href = 'index.html?msg=created';
    });
}

// ---------------- UPDATE USER LOGIC (update.html) ----------------
function initUpdateUser() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'), 10);

    if (!id) {
        window.location.href = 'index.html';
        return;
    }

    const users = getUsers();
    const user = users.find(u => u.id === id);

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userId').value = user.id;
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;

    const form = document.getElementById('updateForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const errors = [];

        if (!name) errors.push("Name is required.");
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push("A valid email address is required.");
        }

        const alertContainer = document.getElementById('alertContainer');
        if (errors.length > 0) {
            alertContainer.innerHTML = `
                <div class="alert alert-error">
                    ${errors.map(err => `<p>${escapeHtml(err)}</p>`).join('')}
                </div>
            `;
            return;
        }

        user.name = name;
        user.email = email;
        saveUsers(users);

        window.location.href = 'index.html?msg=updated';
    });
}
