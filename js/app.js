// ========================================
// EMURAI - Sistem Manajemen Gang Perumahan
// Main JavaScript Application
// ========================================

// Configuration - GANTI DENGAN URL GOOGLE APPS SCRIPT ANDA
const CONFIG = {
    SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
    ADMIN_PASSWORD: 'admin123' // Ganti dengan password yang lebih aman
};

// State Management
const state = {
    isAdmin: false,
    currentPage: 'pageDashboard',
    theme: localStorage.getItem('theme') || 'dark',
    data: {
        kas: [],
        iuran: [],
        ronda: [],
        info: []
    },
    currentWeekOffset: 0
};

// DOM Elements
const elements = {
    splashScreen: document.getElementById('splashScreen'),
    app: document.getElementById('app'),
    pages: document.querySelectorAll('.page'),
    navItems: document.querySelectorAll('.nav-item'),
    themeToggle: document.getElementById('themeToggle'),
    adminToggle: document.getElementById('adminToggle'),
    adminBadge: document.getElementById('adminBadge'),
    userRole: document.getElementById('userRole'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast')
};

// ========== Initialization ==========
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // Set theme
    applyTheme(state.theme);
    
    // Update date
    updateCurrentDate();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    await loadAllData();
    
    // Hide splash screen
    setTimeout(() => {
        elements.splashScreen.classList.add('fade-out');
        elements.app.classList.remove('hidden');
    }, 2000);
}

// ========== Theme Management ==========
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = elements.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
}

// ========== Date & Time ==========
function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    document.getElementById('currentDate').textContent = dateStr;
    
    // Update greeting
    const hour = now.getHours();
    let greeting = 'Selamat Datang';
    if (hour >= 5 && hour < 12) greeting = 'Selamat Pagi';
    else if (hour >= 12 && hour < 15) greeting = 'Selamat Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Selamat Sore';
    else greeting = 'Selamat Malam';
    document.getElementById('greetingText').textContent = greeting;
}

// ========== Event Listeners ==========
function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Admin toggle
    elements.adminToggle.addEventListener('click', () => {
        if (state.isAdmin) {
            logoutAdmin();
        } else {
            openModal('modalLogin');
        }
    });
    
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // Login
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Add buttons
    document.getElementById('btnAddKas').addEventListener('click', () => openKasModal());
    document.getElementById('btnAddIuran').addEventListener('click', () => openIuranModal());
    document.getElementById('btnAddRonda').addEventListener('click', () => openRondaModal());
    document.getElementById('btnAddInfo').addEventListener('click', () => openInfoModal());
    
    // Save buttons
    document.getElementById('btnSaveKas').addEventListener('click', saveKas);
    document.getElementById('btnSaveIuran').addEventListener('click', saveIuran);
    document.getElementById('btnSaveRonda').addEventListener('click', saveRonda);
    document.getElementById('btnSaveInfo').addEventListener('click', saveInfo);
    
    // Filters
    document.getElementById('filterBulan').addEventListener('change', renderTransactions);
    document.getElementById('filterTipe').addEventListener('change', renderTransactions);
    document.getElementById('filterBulanIuran').addEventListener('change', renderIuran);
    document.getElementById('searchRumah').addEventListener('input', renderIuran);
    
    // Week navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        state.currentWeekOffset--;
        renderRondaSchedule();
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
        state.currentWeekOffset++;
        renderRondaSchedule();
    });
    
    // Populate month filters
    populateMonthFilters();
}

// ========== Navigation ==========
function navigateTo(pageId) {
    elements.pages.forEach(page => page.classList.remove('active'));
    elements.navItems.forEach(item => item.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    
    state.currentPage = pageId;
}

// ========== Admin Authentication ==========
function handleLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === CONFIG.ADMIN_PASSWORD) {
        state.isAdmin = true;
        closeModal('modalLogin');
        updateAdminUI();
        showToast('Login berhasil! Mode Admin aktif.', 'success');
        document.getElementById('adminPassword').value = '';
    } else {
        showToast('Kata sandi salah!', 'error');
    }
}

function logoutAdmin() {
    state.isAdmin = false;
    updateAdminUI();
    showToast('Berhasil logout dari mode Admin.', 'success');
}

function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.classList.toggle('hidden', !state.isAdmin);
    });
    
    elements.adminBadge.classList.toggle('hidden', !state.isAdmin);
    elements.userRole.textContent = state.isAdmin ? 'Admin' : 'Guest';
    elements.userRole.classList.toggle('admin', state.isAdmin);
    
    // Update admin toggle icon
    const icon = elements.adminToggle.querySelector('i');
    icon.className = state.isAdmin ? 'fas fa-sign-out-alt' : 'fas fa-user-shield';
}

// ========== Modal Management ==========
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ========== Toast Notifications ==========
function showToast(message, type = 'success') {
    const toast = elements.toast;
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');
    
    toast.className = 'toast ' + type;
    messageEl.textContent = message;
    
    switch(type) {
        case 'success':
            icon.className = 'toast-icon fas fa-check-circle';
            break;
        case 'error':
            icon.className = 'toast-icon fas fa-times-circle';
            break;
        case 'warning':
            icon.className = 'toast-icon fas fa-exclamation-circle';
            break;
    }
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== Loading ==========
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// ========== Data Management ==========
async function loadAllData() {
    showLoading();
    try {
        // Jika belum setup Google Sheets, gunakan sample data
        if (CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            loadSampleData();
        } else {
            const response = await fetch(CONFIG.SCRIPT_URL + '?action=getAll');
            const result = await response.json();
            if (result.success) {
                state.data = result.data;
            }
        }
        
        renderDashboard();
        renderTransactions();
        renderIuran();
        renderRondaSchedule();
        renderInfo();
    } catch (error) {
        console.error('Error loading data:', error);
        loadSampleData();
    }
    hideLoading();
}

function loadSampleData() {
    // Sample data untuk demo
    state.data = {
        kas: [
            { id: 1, tanggal: '2024-01-15', tipe: 'masuk', keterangan: 'Iuran Januari 2024', jumlah: 1500000 },
            { id: 2, tanggal: '2024-01-20', tipe: 'keluar', keterangan: 'Bayar listrik gang', jumlah: 350000 },
            { id: 3, tanggal: '2024-01-25', tipe: 'keluar', keterangan: 'Perbaikan jalan', jumlah: 500000 },
            { id: 4, tanggal: '2024-02-01', tipe: 'masuk', keterangan: 'Iuran Februari 2024', jumlah: 1500000 },
            { id: 5, tanggal: '2024-02-10', tipe: 'keluar', keterangan: 'Bayar PDAM', jumlah: 200000 },
        ],
        iuran: [
            { id: 1, rumah: 'A-01', nama: 'Budi Santoso', bulan: '2024-01', jumlah: 50000, status: 'lunas' },
            { id: 2, rumah: 'A-02', nama: 'Siti Rahayu', bulan: '2024-01', jumlah: 50000, status: 'lunas' },
            { id: 3, rumah: 'A-03', nama: 'Ahmad Wijaya', bulan: '2024-01', jumlah: 50000, status: 'belum' },
            { id: 4, rumah: 'A-04', nama: 'Dewi Lestari', bulan: '2024-01', jumlah: 50000, status: 'lunas' },
            { id: 5, rumah: 'A-05', nama: 'Eko Prasetyo', bulan: '2024-01', jumlah: 50000, status: 'belum' },
            { id: 6, rumah: 'B-01', nama: 'Rina Marlina', bulan: '2024-01', jumlah: 50000, status: 'lunas' },
            { id: 7, rumah: 'B-02', nama: 'Hendra Gunawan', bulan: '2024-01', jumlah: 50000, status: 'lunas' },
            { id: 8, rumah: 'B-03', nama: 'Yuni Astuti', bulan: '2024-01', jumlah: 50000, status: 'belum' },
        ],
        ronda: [
            { id: 1, tanggal: formatDate(new Date()), petugas1: 'Budi Santoso', petugas2: 'Ahmad Wijaya', jam: '22:00 - 05:00' },
            { id: 2, tanggal: formatDate(addDays(new Date(), 1)), petugas1: 'Eko Prasetyo', petugas2: 'Hendra Gunawan', jam: '22:00 - 05:00' },
            { id: 3, tanggal: formatDate(addDays(new Date(), 2)), petugas1: 'Dewi Lestari', petugas2: 'Rina Marlina', jam: '22:00 - 05:00' },
        ],
        info: [
            { id: 1, tanggal: '2024-02-15', judul: 'Kerja Bakti Bulanan', kategori: 'acara', isi: 'Mengundang seluruh warga untuk kerja bakti bersama pada hari Minggu, 25 Februari 2024 pukul 07:00 WIB. Harap membawa peralatan kebersihan masing-masing.' },
            { id: 2, tanggal: '2024-02-10', judul: 'Pembayaran Iuran', kategori: 'penting', isi: 'Diingatkan kepada warga yang belum membayar iuran bulan Januari untuk segera melunasi. Iuran dapat diserahkan ke RT atau melalui transfer.' },
            { id: 3, tanggal: '2024-02-08', judul: 'Peningkatan Keamanan', kategori: 'keamanan', isi: 'Sehubungan dengan maraknya pencurian di wilayah sekitar, dimohon warga untuk meningkatkan kewaspadaan dan memastikan kendaraan terkunci dengan baik.' },
            { id: 4, tanggal: '2024-02-01', judul: 'Jadwal Pemadaman Listrik', kategori: 'umum', isi: 'PLN menginformasikan akan ada pemadaman listrik bergilir pada tanggal 5 Februari 2024 pukul 09:00 - 15:00 WIB untuk pemeliharaan jaringan.' },
        ]
    };
}

// ========== API Calls ==========
async function apiCall(action, data = {}) {
    if (CONFIG.SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        showToast('Silakan setup Google Sheets terlebih dahulu!', 'warning');
        return { success: false };
    }
    
    showLoading();
    try {
        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action, ...data })
        });
        const result = await response.json();
        hideLoading();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        hideLoading();
        showToast('Terjadi kesalahan!', 'error');
        return { success: false };
    }
}

// ========== Dashboard ==========
function renderDashboard() {
    // Calculate totals
    const totalMasuk = state.data.kas.filter(k => k.tipe === 'masuk').reduce((a, b) => a + b.jumlah, 0);
    const totalKeluar = state.data.kas.filter(k => k.tipe === 'keluar').reduce((a, b) => a + b.jumlah, 0);
    const saldo = totalMasuk - totalKeluar;
    
    // This month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthMasuk = state.data.kas.filter(k => k.tipe === 'masuk' && k.tanggal.startsWith(currentMonth)).reduce((a, b) => a + b.jumlah, 0);
    const thisMonthKeluar = state.data.kas.filter(k => k.tipe === 'keluar' && k.tanggal.startsWith(currentMonth)).reduce((a, b) => a + b.jumlah, 0);
    
    // Unique houses
    const uniqueHouses = [...new Set(state.data.iuran.map(i => i.rumah))];
    
    // Update stats
    document.getElementById('totalSaldo').textContent = formatCurrency(saldo);
    document.getElementById('totalPemasukan').textContent = formatCurrency(thisMonthMasuk);
    document.getElementById('totalPengeluaran').textContent = formatCurrency(thisMonthKeluar);
    document.getElementById('totalRumah').textContent = uniqueHouses.length;
    
    // Latest announcements
    const latestAnnouncements = state.data.info.slice(0, 3);
    const announcementsHtml = latestAnnouncements.length > 0 
        ? latestAnnouncements.map(info => `
            <div class="announcement-item ${info.kategori}">
                <h4>${info.judul}</h4>
                <p>${info.isi}</p>
                <div class="meta">
                    <span class="category-tag ${info.kategori}">${info.kategori}</span>
                    <span><i class="far fa-calendar"></i> ${formatDateDisplay(info.tanggal)}</span>
                </div>
            </div>
        `).join('')
        : '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>Belum ada pengumuman</p></div>';
    document.getElementById('latestAnnouncements').innerHTML = announcementsHtml;
    
    // Today's ronda
    const today = formatDate(new Date());
    const todayRonda = state.data.ronda.filter(r => r.tanggal === today);
    const rondaHtml = todayRonda.length > 0
        ? todayRonda.map(r => `
            <div class="ronda-today-item">
                <div class="ronda-avatar">${r.petugas1.charAt(0)}</div>
                <div class="ronda-info">
                    <div class="name">${r.petugas1}</div>
                    <div class="time"><i class="far fa-clock"></i> ${r.jam}</div>
                </div>
            </div>
            <div class="ronda-today-item">
                <div class="ronda-avatar">${r.petugas2.charAt(0)}</div>
                <div class="ronda-info">
                    <div class="name">${r.petugas2}</div>
                    <div class="time"><i class="far fa-clock"></i> ${r.jam}</div>
                </div>
            </div>
        `).join('')
        : '<div class="empty-state"><i class="fas fa-moon"></i><p>Tidak ada jadwal ronda hari ini</p></div>';
    document.getElementById('todayRonda').innerHTML = rondaHtml;
    
    // Overdue payments
    const overduePayments = state.data.iuran.filter(i => i.status === 'belum');
    const overdueHtml = overduePayments.length > 0
        ? overduePayments.slice(0, 5).map(i => `
            <div class="overdue-item">
                <div class="house"><i class="fas fa-home"></i> ${i.rumah} - ${i.nama}</div>
                <div class="amount">${formatCurrency(i.jumlah)}</div>
            </div>
        `).join('')
        : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Semua iuran sudah lunas!</p></div>';
    document.getElementById('overduePayments').innerHTML = overdueHtml;
}

// ========== Kas/Keuangan ==========
function renderTransactions() {
    const filterBulan = document.getElementById('filterBulan').value;
    const filterTipe = document.getElementById('filterTipe').value;
    
    let filtered = [...state.data.kas];
    
    if (filterBulan) {
        filtered = filtered.filter(k => k.tanggal.startsWith(filterBulan));
    }
    
    if (filterTipe) {
        filtered = filtered.filter(k => k.tipe === filterTipe);
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const html = filtered.length > 0
        ? filtered.map(k => `
            <div class="transaction-item ${k.tipe}">
                <div class="transaction-icon">
                    <i class="fas fa-arrow-${k.tipe === 'masuk' ? 'down' : 'up'}"></i>
                </div>
                <div class="transaction-info">
                    <div class="desc">${k.keterangan}</div>
                    <div class="date">${formatDateDisplay(k.tanggal)}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount">${k.tipe === 'masuk' ? '+' : '-'} ${formatCurrency(k.jumlah)}</div>
                </div>
                ${state.isAdmin ? `
                    <div class="transaction-actions">
                        <button class="action-btn edit" onclick="editKas(${k.id})">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteKas(${k.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('')
        : '<div class="empty-state"><i class="fas fa-inbox"></i><p>Tidak ada transaksi</p></div>';
    
    document.getElementById('transactionList').innerHTML = html;
}

function openKasModal(id = null) {
    const modal = document.getElementById('modalKas');
    const title = document.getElementById('modalKasTitle');
    
    if (id) {
        const kas = state.data.kas.find(k => k.id === id);
        if (kas) {
            title.innerHTML = '<i class="fas fa-edit"></i> Edit Transaksi';
            document.getElementById('kasId').value = kas.id;
            document.getElementById('kasTanggal').value = kas.tanggal;
            document.querySelector(`input[name="kasTipe"][value="${kas.tipe}"]`).checked = true;
            document.getElementById('kasKeterangan').value = kas.keterangan;
            document.getElementById('kasJumlah').value = kas.jumlah;
        }
    } else {
        title.innerHTML = '<i class="fas fa-plus-circle"></i> Tambah Transaksi';
        document.getElementById('kasId').value = '';
        document.getElementById('kasTanggal').value = formatDate(new Date());
        document.querySelector('input[name="kasTipe"][value="masuk"]').checked = true;
        document.getElementById('kasKeterangan').value = '';
        document.getElementById('kasJumlah').value = '';
    }
    
    openModal('modalKas');
}

async function saveKas() {
    const id = document.getElementById('kasId').value;
    const tanggal = document.getElementById('kasTanggal').value;
    const tipe = document.querySelector('input[name="kasTipe"]:checked').value;
    const keterangan = document.getElementById('kasKeterangan').value;
    const jumlah = parseInt(document.getElementById('kasJumlah').value);
    
    if (!tanggal || !keterangan || !jumlah) {
        showToast('Harap isi semua field!', 'error');
        return;
    }
    
    const kasData = { tanggal, tipe, keterangan, jumlah };
    
    if (CONFIG.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        const action = id ? 'updateKas' : 'addKas';
        const result = await apiCall(action, { id: id || undefined, ...kasData });
        if (result.success) {
            await loadAllData();
        }
    } else {
        // Local update for demo
        if (id) {
            const index = state.data.kas.findIndex(k => k.id == id);
            if (index !== -1) {
                state.data.kas[index] = { id: parseInt(id), ...kasData };
            }
        } else {
            const newId = Math.max(...state.data.kas.map(k => k.id), 0) + 1;
            state.data.kas.push({ id: newId, ...kasData });
        }
        renderDashboard();
        renderTransactions();
    }
    
    closeModal('modalKas');
    showToast(id ? 'Transaksi berhasil diupdate!' : 'Transaksi berhasil ditambahkan!', 'success');
}

function editKas(id) {
    openKasModal(id);
}

async function deleteKas(id) {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        if (CONFIG.SCRIPT_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            const result = await apiCall('deleteKas', { id });
            if (result.success) {
                await loadAllData();
            }
        } else {
            state.data.kas = state.data.kas.filter(k => k.id !== id);
            renderDashboard();
            renderTransactions();
        }
        showToast('Transaksi berhasil dihapus!', 'success');
    }
}

// ========== Iuran ==========
function renderIuran() {
    const filterBulan = document.getElementById('filterBulanIuran').value;
    const searchQuery = document.getElementById('searchRumah').value.toLowerCase();
    
    let filtered = [...state.data.iuran];
    
    if (filterBulan) {
        filtered = filtered.filter(i => i.bulan === filterBulan);
    }
    
    if (searchQuery) {
        filtered = filtered.filter(i => 
            i.rumah.toLowerCase().includes(searchQuery) || 
            i.nama.toLowerCase().includes(searchQuery)
        );
    }
    
    // Sort by house number
    filtered.sort((a, b) => a.rumah.localeCompare(b.rumah));
    
    const html = filtered.length > 0
        ? filtered.map(i => `
            <div class="iuran-card ${i.status}">
                <div 
