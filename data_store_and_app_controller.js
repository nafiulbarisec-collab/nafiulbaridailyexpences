(function() {
    // In-memory data store without using browser localStorage
    const defaultProfile = {
        name: "Secure Data Manager",
        currency: "৳",
        monthlyBudget: 25000,
        cycleStartDay: 1
    };

    const defaultCategoriesBase = {
        expense: ["Food", "Transport", "Health", "Education", "Shopping", "Entertainment", "Other"],
        income: ["Salary", "Business", "Freelance", "Investment", "Gift", "Other"],
        bazar: ["Vegetables", "Fish & Meat", "Grocery", "Fruits", "Snacks", "Other"],
        bill: ["Electricity", "Gas", "Water", "Internet", "House Rent", "Mobile Recharge", "Other"]
    };

    let appData = {
        profile: { ...defaultProfile },
        customCategories: { ...defaultCategoriesBase },
        transactions: [
            {
                id: 'tx_seed_1',
                type: 'income',
                date: new Date().toISOString().split('T')[0],
                name: 'Monthly Salary',
                amount: 45000,
                category: 'Salary',
                note: 'Primary job earnings',
                timestamp: Date.now() - 86400000 * 5
            },
            {
                id: 'tx_seed_2',
                type: 'bazar',
                date: new Date().toISOString().split('T')[0],
                name: 'Fresh Vegetables & Beef',
                amount: 1850,
                category: 'Fish & Meat',
                note: 'Weekly kitchen market bazar',
                timestamp: Date.now() - 86400000 * 3
            },
            {
                id: 'tx_seed_3',
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                name: 'Uber Commute',
                amount: 450,
                category: 'Transport',
                note: 'Office travel',
                timestamp: Date.now() - 86400000 * 2
            },
            {
                id: 'tx_seed_4',
                type: 'bill',
                date: new Date().toISOString().split('T')[0],
                name: 'High-speed Fiber Internet',
                amount: 1500,
                category: 'Internet',
                note: 'Monthly ISP bill',
                timestamp: Date.now() - 86400000 * 1
            }
        ]
    };

    let expenseChartInstance = null;
    let trendChartInstance = null;

    window.showMessage = function(title, content, onConfirm = null, showCancel = false, icon = 'info') {
        const container = document.getElementById('message-box-container');
        const titleEl = document.getElementById('msg-title');
        const contentEl = document.getElementById('msg-content');
        const confirmBtn = document.getElementById('msg-confirm-btn');
        const cancelBtn = document.getElementById('msg-cancel-btn');
        
        titleEl.textContent = title;
        contentEl.textContent = content;
        cancelBtn.classList.toggle('hidden', !showCancel);
        
        const newConfirm = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
        const newCancel = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

        newConfirm.addEventListener('click', () => {
            container.classList.remove('active');
            if(onConfirm) onConfirm();
        });

        newCancel.addEventListener('click', () => {
            container.classList.remove('active');
        });

        container.classList.add('active');
    };

    function persistAndUpdate() {
        window.renderAllData();
    }

    window.performClearData = function() {
        window.showMessage("Reset Data", "Are you sure you want to reset all data and restore defaults?", () => {
            appData.transactions = [];
            appData.profile = { ...defaultProfile };
            appData.customCategories = { ...defaultCategoriesBase };
            applyProfileSettingsToUI();
            renderAllCategories();
            window.handlePresetDateChange();
        }, true, 'alert-triangle');
    };

    window.exportAppData = function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "finance_bazar_export.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    function applyProfileSettingsToUI() {
        document.getElementById('app-profile-name').textContent = appData.profile.name;
        document.getElementById('setting-profile-name').value = appData.profile.name;
        document.getElementById('setting-currency-symbol').value = appData.profile.currency;
        document.getElementById('setting-monthly-budget').value = appData.profile.monthlyBudget || 0;
        document.getElementById('setting-cycle-start').value = appData.profile.cycleStartDay || 1;
        
        document.querySelectorAll('.currency-display').forEach(el => {
            el.textContent = appData.profile.currency;
        });
        lucide.createIcons();
    }

    function renderAllCategories() {
        const container = document.getElementById('custom-categories-list');
        container.innerHTML = '';
        
        Object.keys(appData.customCategories).forEach(type => {
            appData.customCategories[type].forEach(cat => {
                if(!defaultCategoriesBase[type].includes(cat)) {
                    const div = document.createElement('div');
                    div.className = 'bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-slate-200';
                    div.innerHTML = `
                        <span class="capitalize opacity-50">${type}:</span> ${cat}
                        <button type="button" onclick="window.deleteCustomCategory('${type}', '${cat}')" class="text-slate-400 hover:text-rose-500 transition ml-1"><i data-lucide="x" class="w-3 h-3"></i></button>
                    `;
                    container.appendChild(div);
                }
            });
        });
        lucide.createIcons();
    }

    window.handlePresetDateChange = function() {
        const preset = document.getElementById('preset-date-range').value;
        const startInput = document.getElementById('start-date');
        const endInput = document.getElementById('end-date');
        
        const today = new Date();
        let cycleStartDay = parseInt(appData.profile.cycleStartDay) || 1;
        cycleStartDay = Math.min(Math.max(cycleStartDay, 1), 28);
        
        let currentMonthStart = new Date(today.getFullYear(), today.getMonth(), cycleStartDay);
        if (today.getDate() < cycleStartDay) {
            currentMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, cycleStartDay);
        }

        if (preset === 'this_month') {
            let currentMonthEnd = new Date(currentMonthStart);
            currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
            currentMonthEnd.setDate(cycleStartDay - 1);
            
            startInput.value = currentMonthStart.toISOString().split('T')[0];
            endInput.value = currentMonthEnd.toISOString().split('T')[0];
        } else if (preset === 'last_month') {
            let lastMonthStart = new Date(currentMonthStart);
            lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
            
            let lastMonthEnd = new Date(currentMonthStart);
            lastMonthEnd.setDate(cycleStartDay - 1);
            
            startInput.value = lastMonthStart.toISOString().split('T')[0];
            endInput.value = lastMonthEnd.toISOString().split('T')[0];
        } else if (preset === 'this_year') {
            startInput.value = `${today.getFullYear()}-01-01`;
            endInput.value = `${today.getFullYear()}-12-31`;
        }
        
        window.renderAllData();
    };

    window.handleCustomDateChange = function() {
        document.getElementById('preset-date-range').value = 'custom';
        window.renderAllData();
    };

    function getFilteredTransactions() {
        const startStr = document.getElementById('start-date').value;
        const endStr = document.getElementById('end-date').value;
        const searchQ = document.getElementById('global-search').value.toLowerCase();
        
        const start = new Date(startStr);
        start.setHours(0,0,0,0);
        const end = new Date(endStr);
        end.setHours(23,59,59,999);

        return appData.transactions.filter(t => {
            const tDate = new Date(t.date);
            const inRange = tDate >= start && tDate <= end;
            const matchesSearch = !searchQ || 
                t.name.toLowerCase().includes(searchQ) || 
                t.category.toLowerCase().includes(searchQ) || 
                (t.note && t.note.toLowerCase().includes(searchQ));
            return inRange && matchesSearch;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function formatCurrency(amount) {
        return `${appData.profile.currency} ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    window.renderAllData = function() {
        const txs = getFilteredTransactions();
        let totals = { income: 0, expense: 0, bazar: 0, bill: 0 };
        
        const listContainers = {
            bazar: document.getElementById('list-bazar'),
            expense: document.getElementById('list-expense'),
            income: document.getElementById('list-income'),
            bill: document.getElementById('list-bill'),
            recent: document.getElementById('recent-transactions-list')
        };
        
        Object.values(listContainers).forEach(el => el.innerHTML = '');

        txs.forEach((t, index) => {
            totals[t.type] += parseFloat(t.amount);
            
            const cardHTML = `
                <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 group relative overflow-hidden">
                    <div class="flex items-center gap-3 w-full">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getTypeColorClass(t.type)}">
                            <i data-lucide="${getTypeIcon(t.type)}" class="w-5 h-5"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-slate-800 truncate">${t.name}</h4>
                            <div class="flex items-center gap-2 mt-0.5">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 truncate">${t.category}</span>
                                <span class="text-[10px] text-slate-400">${t.date}</span>
                            </div>
                            ${t.note ? `<p class="text-[10px] text-slate-500 mt-1 truncate">${t.note}</p>` : ''}
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-sm font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}">
                                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                            </div>
                            <div class="flex gap-2 justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.editEntry('${t.id}')" class="text-indigo-500 hover:text-indigo-700"><i data-lucide="edit" class="w-3.5 h-3.5"></i></button>
                                <button onclick="window.deleteEntry('${t.id}')" class="text-rose-500 hover:text-rose-700"><i data-lucide="trash" class="w-3.5 h-3.5"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            if (listContainers[t.type]) listContainers[t.type].insertAdjacentHTML('beforeend', cardHTML);
            if (index < 5) listContainers.recent.insertAdjacentHTML('beforeend', cardHTML);
        });

        Object.keys(listContainers).forEach(key => {
            if (listContainers[key].innerHTML === '') {
                listContainers[key].innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-slate-100 border-dashed">No records found for this period.</div>`;
            }
        });

        document.getElementById('dash-income').textContent = formatCurrency(totals.income);
        const totalOutgoing = totals.expense + totals.bazar + totals.bill;
        document.getElementById('dash-expense').textContent = formatCurrency(totalOutgoing);
        document.getElementById('dash-bazar').textContent = formatCurrency(totals.bazar);
        document.getElementById('dash-savings').textContent = formatCurrency(totals.income - totalOutgoing);

        const budget = parseFloat(appData.profile.monthlyBudget) || 1;
        const percentage = Math.min(100, (totalOutgoing / budget) * 100);
        
        const pBar = document.getElementById('budget-progress-bar');
        pBar.style.width = `${percentage}%`;
        document.getElementById('budget-status-text').textContent = `${percentage.toFixed(1)}% Used`;
        document.getElementById('budget-spent-text').textContent = `Spent: ${formatCurrency(totalOutgoing)}`;
        document.getElementById('budget-left-text').textContent = `Limit: ${formatCurrency(budget)}`;
        
        if(percentage > 90) {
            pBar.classList.replace('bg-indigo-500', 'bg-rose-500');
            document.getElementById('budget-status-text').classList.replace('text-indigo-600', 'text-rose-600');
            document.getElementById('budget-status-text').classList.replace('bg-indigo-50', 'bg-rose-50');
        } else {
            pBar.classList.replace('bg-rose-500', 'bg-indigo-500');
            document.getElementById('budget-status-text').classList.replace('text-rose-600', 'text-indigo-600');
            document.getElementById('budget-status-text').classList.replace('bg-rose-50', 'bg-indigo-50');
        }

        renderCharts(txs);
        lucide.createIcons();
    };

    function getTypeColorClass(type) {
        return {
            bazar: 'bg-amber-100 text-amber-600',
            expense: 'bg-rose-100 text-rose-600',
            income: 'bg-emerald-100 text-emerald-600',
            bill: 'bg-blue-100 text-blue-600'
        }[type];
    }

    function getTypeIcon(type) {
        return { bazar: 'shopping-cart', expense: 'trending-down', income: 'trending-up', bill: 'receipt' }[type];
    }

    window.switchTab = function(tabId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${tabId}`).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(el => {
            const target = el.getAttribute('data-target');
            if (target === tabId) {
                el.classList.add('text-indigo-600');
                el.classList.remove('text-slate-400');
            } else {
                el.classList.remove('text-indigo-600');
                el.classList.add('text-slate-400');
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.toggleFab = function() {
        const container = document.querySelector('.fab-container');
        const backdrop = document.querySelector('.fab-backdrop');
        container.classList.toggle('open');
        backdrop.classList.toggle('active');
    };

    window.openModal = function(type, existingData = null) {
        const modal = document.getElementById('input-modal');
        const form = document.getElementById('entry-form');
        form.reset();
        
        document.getElementById('entry-type').value = type;
        document.getElementById('entry-id').value = existingData ? existingData.id : '';
        document.getElementById('entry-date').value = existingData ? existingData.date : new Date().toISOString().split('T')[0];
        
        const titles = { bazar: "Add Bazar", expense: "Add Expense", income: "Add Income", bill: "Add Bill" };
        const icons = { bazar: "shopping-cart", expense: "trending-down", income: "trending-up", bill: "receipt" };
        
        document.getElementById('modal-title-text').textContent = existingData ? `Edit ${titles[type].split(' ')[1]}` : titles[type];
        document.getElementById('modal-icon').innerHTML = `<i data-lucide="${icons[type]}" class="w-5 h-5"></i>`;
        
        const catSelect = document.getElementById('entry-category');
        catSelect.innerHTML = '';
        (appData.customCategories[type] || []).forEach(cat => {
            catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });

        if (existingData) {
            document.getElementById('entry-name').value = existingData.name;
            document.getElementById('entry-amount').value = existingData.amount;
            document.getElementById('entry-category').value = existingData.category;
            document.getElementById('entry-note').value = existingData.note || '';
        }

        modal.classList.remove('hidden');
        setTimeout(() => modal.classList.add('opacity-100'), 10);
        lucide.createIcons();
    };

    window.closeModal = function() {
        const modal = document.getElementById('input-modal');
        modal.classList.remove('opacity-100');
        setTimeout(() => modal.classList.add('hidden'), 200);
    };

    window.saveEntry = function(event) {
        event.preventDefault();

        const id = document.getElementById('entry-id').value;
        const entry = {
            type: document.getElementById('entry-type').value,
            date: document.getElementById('entry-date').value,
            name: document.getElementById('entry-name').value,
            amount: parseFloat(document.getElementById('entry-amount').value),
            category: document.getElementById('entry-category').value,
            note: document.getElementById('entry-note').value,
            timestamp: Date.now()
        };
        
        if (id) {
            const index = appData.transactions.findIndex(t => t.id === id);
            if (index > -1) {
                appData.transactions[index] = { ...appData.transactions[index], ...entry };
            }
        } else {
            entry.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            appData.transactions.push(entry);
        }

        persistAndUpdate();
        window.closeModal();
    };

    window.editEntry = function(id) {
        const entry = appData.transactions.find(t => t.id === id);
        if (entry) window.openModal(entry.type, entry);
    };

    window.deleteEntry = function(id) {
        window.showMessage("Delete Record", "Are you sure you want to delete this record?", () => {
            appData.transactions = appData.transactions.filter(t => t.id !== id);
            persistAndUpdate();
        }, true, 'trash-2');
    };

    window.handleSaveProfileSettings = function(e) {
        e.preventDefault();

        appData.profile.name = document.getElementById('setting-profile-name').value;
        appData.profile.currency = document.getElementById('setting-currency-symbol').value;
        appData.profile.monthlyBudget = parseFloat(document.getElementById('setting-monthly-budget').value);
        appData.profile.cycleStartDay = parseInt(document.getElementById('setting-cycle-start').value);

        applyProfileSettingsToUI();
        renderAllCategories();
        window.handlePresetDateChange();
        window.showMessage("Success", "Settings updated in memory.");
    };

    window.handleAddCustomCategory = function(e) {
        e.preventDefault();
        const type = document.getElementById('new-cat-type').value;
        const name = document.getElementById('new-cat-name').value.trim();
        
        if (name && !appData.customCategories[type].includes(name)) {
            appData.customCategories[type].push(name);
            renderAllCategories();
            document.getElementById('new-cat-name').value = '';
        }
    };

    window.deleteCustomCategory = function(type, catName) {
        window.showMessage("Delete Category", `Remove '${catName}' from categories?`, () => {
            appData.customCategories[type] = appData.customCategories[type].filter(c => c !== catName);
            renderAllCategories();
        }, true);
    };

    function renderCharts(txs) {
        const categoryTotals = {};
        txs.filter(t => t.type !== 'income').forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const catLabels = Object.keys(categoryTotals);
        const catData = Object.values(categoryTotals);
        
        const ctxExpense = document.getElementById('expenseChart').getContext('2d');
        if (expenseChartInstance) expenseChartInstance.destroy();
        
        expenseChartInstance = new Chart(ctxExpense, {
            type: 'doughnut',
            data: {
                labels: catLabels.length ? catLabels : ['No Data'],
                datasets: [{
                    data: catData.length ? catData : [1],
                    backgroundColor: catData.length ? ['#4f46e5', '#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#ec4899'] : ['#e2e8f0'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, padding: 15, font: { size: 10, family: 'Plus Jakarta Sans' } } }
                }
            }
        });

        const dates = {};
        txs.forEach(t => {
            if (!dates[t.date]) dates[t.date] = { income: 0, expense: 0 };
            if (t.type === 'income') dates[t.date].income += t.amount;
            else dates[t.date].expense += t.amount;
        });

        const sortedDates = Object.keys(dates).sort((a,b) => new Date(a) - new Date(b));
        const trendLabels = sortedDates.map(d => {
            const parts = d.split('-');
            return `${parts[2]}/${parts[1]}`;
        });
        const incData = sortedDates.map(d => dates[d].income);
        const expData = sortedDates.map(d => dates[d].expense);

        const ctxTrend = document.getElementById('trendChart').getContext('2d');
        if (trendChartInstance) trendChartInstance.destroy();

        trendChartInstance = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: trendLabels,
                datasets: [
                    {
                        label: 'Income',
                        data: incData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Outgoings',
                        data: expData,
                        borderColor: '#f43f5e',
                        backgroundColor: 'rgba(244, 63, 94, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11, family: 'Plus Jakarta Sans' } } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }
                }
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyProfileSettingsToUI();
        renderAllCategories();
        window.handlePresetDateChange();
        lucide.createIcons();
    });
})();