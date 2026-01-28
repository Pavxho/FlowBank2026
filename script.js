// ===== BANKING SYSTEM JS =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the banking application
    initBankingApp();
});

// ===== APP STATE =====
const bankData = {
    balance: 0,
    transactions: [],
    contactMessages: [],
    settings: {
        dailyDepositLimit: 25000,
        dailyWithdrawalLimit: 5000,
        minBalance: 10,
        maxDepositPerTransaction: 10000,
        sessionTimeout: 1800 // 30 minutes in seconds
    },
    stats: {
        lastBackup: null,
        totalTransactions: 0,
        monthlyStats: {}
    },
    accounts: null // Will be initialized in initAccountsSection
};

// ===== SESSION MANAGEMENT =====
let sessionTimer;
let sessionTimeLeft = bankData.settings.sessionTimeout;

// ===== INITIALIZE APP =====
function initBankingApp() {
    console.log('Initializing BankFlow Application...');
    
    // Initialize EmailJS (replace with your own public key)
    emailjs.init('YOUR_PUBLIC_KEY'); // You'll need to get this from EmailJS
    
    // Load data from localStorage
    loadDataFromStorage();
    
    // Setup all components
    setupNavigation();
    setupForms();
    setupFilters();
    setupQuickActions();
    setupButtons();
    setupModal();
    setupSessionTimer();
    setupQuickWithdrawals();
    setupDataManagement();
    initAccountsSection(); // Initialize accounts section
    
    // Update UI with loaded data
    updateUI();
    
    // Update current date in footer
    updateCurrentDate();
    updateCurrentYear();
    
    // Set last login time
    const lastLoginEl = document.getElementById('last-login');
    if (lastLoginEl) {
        const now = new Date();
        const options = { 
            weekday: 'short', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        lastLoginEl.textContent = now.toLocaleTimeString('en-US', options);
    }
    
    console.log('BankFlow Application initialized successfully!');
}

// ===== ACCOUNTS & CARDS FUNCTIONS =====
function initAccountsSection() {
    console.log('Initializing Accounts & Cards section...');
    
    // Initialize account data if not exists
    if (!bankData.accounts) {
        bankData.accounts = {
            checking: {
                id: 'CHK-4589-2104',
                balance: 12450.75,
                accountNumber: '4589210489324567',
                routingNumber: '021000021',
                type: 'checking',
                status: 'active',
                lastFour: '4567',
                expiry: '12/26'
            },
            savings: {
                id: 'SAV-7890-2341',
                balance: 8450.25,
                type: 'savings',
                status: 'active',
                apy: 2.5,
                goal: 10000,
                monthlyInterest: 17.60
            },
            credit: {
                id: 'CC-1234-5678',
                balance: 1245.50,
                type: 'credit',
                status: 'active',
                limit: 5000,
                dueDate: '2024-02-15',
                minPayment: 35.00,
                apr: 18.9
            }
        };
    }
    
    // Setup account buttons and interactions
    setupAccountButtons();
    setupCardActions();
    updateAccountsDisplay();
    updateTotalBalance();
}

function setupAccountButtons() {
    // Copy account number buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-clipboard-target');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const text = targetElement.textContent;
                copyToClipboard(text);
                showToast('Account number copied to clipboard', 'success');
                
                // Visual feedback
                const icon = this.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-check';
                    setTimeout(() => {
                        icon.className = 'far fa-copy';
                    }, 2000);
                }
            }
        });
    });
    
    // Transfer buttons
    document.querySelectorAll('.transfer-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            navigateToSection('#transactions');
            showToast(`Transfer from ${accountType} account selected`, 'info');
        });
    });
    
    // Deposit/Withdraw buttons for savings
    document.querySelectorAll('.deposit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            if (accountType === 'savings') {
                navigateToSection('#deposit');
                const descInput = document.getElementById('deposit-description');
                if (descInput) descInput.value = 'Savings deposit';
                showToast('Deposit to savings selected', 'info');
            }
        });
    });
    
    document.querySelectorAll('.withdraw-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            if (accountType === 'savings') {
                navigateToSection('#withdraw');
                const descInput = document.getElementById('withdraw-description');
                if (descInput) descInput.value = 'Savings withdrawal';
                showToast('Withdraw from savings selected', 'info');
            }
        });
    });
    
    // Credit card actions
    document.querySelectorAll('.pay-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            if (accountType === 'credit' && bankData.accounts.credit) {
                showConfirmationModal(
                    'Pay Credit Card Bill',
                    `Pay $${bankData.accounts.credit.balance.toFixed(2)} from your checking account?`,
                    function() {
                        payCreditCardBill();
                    }
                );
            }
        });
    });
    
    // View details buttons
    document.querySelectorAll('.details-btn, .statement-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            if (accountType === 'checking') {
                showAccountDetails('checking');
            } else if (accountType === 'credit') {
                showAccountDetails('credit');
            }
        });
    });
    
    // Account menu buttons
    document.querySelectorAll('.account-menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            const accountType = this.getAttribute('data-account');
            showAccountMenu(accountType);
        });
    });
}

function setupCardActions() {
    // Freeze card button
    const freezeBtn = document.getElementById('freeze-card');
    if (freezeBtn) {
        freezeBtn.addEventListener('click', function() {
            const isFrozen = this.classList.toggle('frozen');
            
            if (isFrozen) {
                this.innerHTML = '<i class="fas fa-sun"></i><span>Unfreeze</span>';
                showToast('Card frozen successfully. Transactions will be declined.', 'success');
            } else {
                this.innerHTML = '<i class="fas fa-snowflake"></i><span>Freeze</span>';
                showToast('Card unfrozen. Transactions are now enabled.', 'success');
            }
            
            // Update card status in data
            if (bankData.accounts.checking) {
                bankData.accounts.checking.status = isFrozen ? 'frozen' : 'active';
                saveDataToStorage();
            }
        });
    }
    
    // View card details
    const viewDetailsBtn = document.getElementById('view-card-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            if (bankData.accounts.checking) {
                showConfirmationModal(
                    'Card Details',
                    `<div class="card-details-modal">
                        <div class="detail-row">
                            <span class="label">Card Number:</span>
                            <span class="value">${bankData.accounts.checking.accountNumber}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Expiry Date:</span>
                            <span class="value">${bankData.accounts.checking.expiry || '12/26'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">CVV:</span>
                            <span class="value">•••</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Card Type:</span>
                            <span class="value">Visa Debit</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span>
                            <span class="value ${bankData.accounts.checking.status === 'frozen' ? 'negative' : 'positive'}">
                                ${bankData.accounts.checking.status === 'frozen' ? 'Frozen' : 'Active'}
                            </span>
                        </div>
                    </div>`,
                    null,
                    'info'
                );
            }
        });
    }
    
    // Replace card
    const replaceCardBtn = document.getElementById('replace-card');
    if (replaceCardBtn) {
        replaceCardBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Replace Card',
                'Request a new card? Your current card will be deactivated immediately and a new one will be mailed within 5-7 business days. There is a $10 replacement fee.',
                function() {
                    replaceCard();
                }
            );
        });
    }
    
    // Add account button
    const addAccountBtn = document.getElementById('add-account-btn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', function() {
            showAddAccountModal();
        });
    }
}

function showAddAccountModal() {
    showConfirmationModal(
        'Add New Account',
        `
        <div class="account-options">
            <button class="account-option-btn" data-type="checking">
                <i class="fas fa-wallet"></i>
                <span>Checking Account</span>
                <small>No monthly fees, debit card included</small>
            </button>
            <button class="account-option-btn" data-type="savings">
                <i class="fas fa-piggy-bank"></i>
                <span>Savings Account</span>
                <small>2.5% APY, no minimum balance</small>
            </button>
            <button class="account-option-btn" data-type="credit">
                <i class="fas fa-credit-card"></i>
                <span>Credit Card</span>
                <small>18.9% APR, $5,000 limit</small>
            </button>
        </div>
        `,
        null,
        'custom'
    );
    
    // Add event listeners to option buttons
    setTimeout(() => {
        document.querySelectorAll('.account-option-btn').forEach(button => {
            button.addEventListener('click', function() {
                const accountType = this.getAttribute('data-type');
                addNewAccount(accountType);
                hideModal();
            });
        });
    }, 100);
}

function addNewAccount(accountType) {
    let newAccount;
    const accountId = Date.now().toString().slice(-8);
    const accountSuffix = Math.floor(1000 + Math.random() * 9000);
    
    switch(accountType) {
        case 'checking':
            newAccount = {
                id: `CHK-${accountId}`,
                balance: 0,
                accountNumber: `4589${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${accountSuffix}`,
                routingNumber: '021000021',
                type: 'checking',
                status: 'active',
                lastFour: accountSuffix.toString()
            };
            
            // Set expiry 3 years from now
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 3);
            newAccount.expiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;
            break;
            
        case 'savings':
            newAccount = {
                id: `SAV-${accountId}`,
                balance: 0,
                type: 'savings',
                status: 'active',
                apy: 2.5,
                goal: 10000,
                monthlyInterest: 0
            };
            break;
            
        case 'credit':
            newAccount = {
                id: `CC-${accountId}`,
                balance: 0,
                type: 'credit',
                status: 'active',
                limit: 5000,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                minPayment: 0,
                apr: 18.9
            };
            break;
    }
    
    if (!bankData.accounts) bankData.accounts = {};
    const accountKey = `${accountType}_${accountId}`;
    bankData.accounts[accountKey] = newAccount;
    
    saveDataToStorage();
    updateAccountsDisplay();
    
    showToast(`New ${accountType} account created successfully! Account #: ${newAccount.id}`, 'success');
}

function updateAccountsDisplay() {
    if (!bankData.accounts) return;
    
    // Update checking account
    const checking = bankData.accounts.checking;
    if (checking) {
        document.getElementById('checking-balance').textContent = checking.balance.toFixed(2);
        document.getElementById('checking-account-number').textContent = `•••• ${checking.lastFour || '4567'}`;
        document.getElementById('checking-routing').textContent = checking.routingNumber || '021000021';
    }
    
    // Update savings account
    const savings = bankData.accounts.savings;
    if (savings) {
        document.getElementById('savings-balance').textContent = savings.balance.toFixed(2);
        document.getElementById('savings-account-number').textContent = savings.id || 'SAV-7890-2341';
        
        // Calculate and update interest
        if (savings.apy && savings.balance) {
            const monthlyInterest = (savings.balance * (savings.apy / 100)) / 12;
            const growthEl = document.querySelector('.account-growth .growth-amount');
            if (growthEl) {
                growthEl.textContent = `+$${monthlyInterest.toFixed(2)}`;
                growthEl.className = 'growth-amount positive';
            }
        }
        
        // Update savings progress
        if (savings.goal && savings.balance) {
            const progress = Math.min((savings.balance / savings.goal) * 100, 100);
            const progressBar = document.querySelector('.goal-progress .progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            const goalInfo = document.querySelector('.goal-info');
            if (goalInfo) {
                goalInfo.innerHTML = `<span>Goal: $${savings.goal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span><span>${progress.toFixed(0)}%</span>`;
            }
        }
    }
    
    // Update credit card
    const credit = bankData.accounts.credit;
    if (credit) {
        document.getElementById('credit-balance').textContent = credit.balance.toFixed(2);
        
        // Update due date
        const dueDateEl = document.getElementById('credit-due-date');
        if (dueDateEl && credit.dueDate) {
            const dueDate = new Date(credit.dueDate);
            dueDateEl.textContent = dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        
        // Update utilization
        if (credit.limit && credit.balance !== undefined) {
            const utilization = (credit.balance / credit.limit) * 100;
            const utilizationBar = document.querySelector('.utilization-bar .progress-bar');
            const utilizationPercent = document.querySelector('.utilization-header span:last-child');
            
            if (utilizationBar) {
                utilizationBar.style.width = `${utilization}%`;
                // Color based on utilization
                if (utilization > 80) {
                    utilizationBar.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                } else if (utilization > 50) {
                    utilizationBar.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                } else {
                    utilizationBar.style.background = 'var(--gradient-primary)';
                }
            }
            if (utilizationPercent) {
                utilizationPercent.textContent = `${utilization.toFixed(0)}%`;
                utilizationPercent.className = utilization > 50 ? 'negative' : 'positive';
            }
        }
    }
    
    // Update card display
    const cardLastFour = document.getElementById('card-last-four');
    const cardExpiry = document.getElementById('card-expiry');
    
    if (cardLastFour && checking && checking.lastFour) {
        cardLastFour.textContent = checking.lastFour;
    }
    
    if (cardExpiry && checking && checking.expiry) {
        cardExpiry.textContent = checking.expiry;
    }
    
    // Update freeze button state
    const freezeBtn = document.getElementById('freeze-card');
    if (freezeBtn && checking && checking.status === 'frozen') {
        freezeBtn.classList.add('frozen');
        freezeBtn.innerHTML = '<i class="fas fa-sun"></i><span>Unfreeze</span>';
    }
}

function updateTotalBalance() {
    if (!bankData.accounts) return;
    
    let totalBalance = 0;
    let checkingBalance = 0;
    
    // Calculate total balance from all accounts
    Object.values(bankData.accounts).forEach(account => {
        if (account.type === 'checking' || account.type === 'savings') {
            totalBalance += account.balance;
            if (account.type === 'checking') {
                checkingBalance = account.balance;
            }
        } else if (account.type === 'credit') {
            // Subtract credit card balance
            totalBalance -= account.balance;
        }
    });
    
    // Update main balance display
    bankData.balance = totalBalance;
    
    // Update UI elements
    const elements = {
        'current-balance': totalBalance.toFixed(2),
        'deposit-balance-preview': checkingBalance.toFixed(2),
        'withdraw-balance-preview': checkingBalance.toFixed(2),
        'max-withdrawal': Math.max(0, checkingBalance - bankData.settings.minBalance).toFixed(2)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    saveDataToStorage();
}

function payCreditCardBill() {
    if (!bankData.accounts.checking || !bankData.accounts.credit) {
        showToast('Unable to process payment', 'error');
        return;
    }
    
    const amount = bankData.accounts.credit.balance;
    
    // Check if checking has enough funds
    if (bankData.accounts.checking.balance < amount) {
        showToast('Insufficient funds in checking account', 'error');
        return;
    }
    
    // Process payment
    bankData.accounts.checking.balance -= amount;
    bankData.accounts.credit.balance = 0;
    
    // Add transaction record
    const transaction = {
        id: Date.now(),
        type: 'withdraw',
        amount: amount,
        description: 'Credit Card Payment',
        date: new Date(),
        balance: bankData.accounts.checking.balance
    };
    
    bankData.transactions.unshift(transaction);
    saveDataToStorage();
    
    updateAccountsDisplay();
    updateTotalBalance();
    updateRecentTransactions();
    updateTransactionsList();
    updateTransactionSummary();
    
    showToast(`Credit card payment of $${amount.toFixed(2)} completed successfully!`, 'success');
}

function replaceCard() {
    if (!bankData.accounts.checking) return;
    
    // Generate new card details
    const newLastFour = Math.floor(1000 + Math.random() * 9000);
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);
    const newExpiry = `${(expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear().toString().slice(-2)}`;
    
    // Update card data
    bankData.accounts.checking.lastFour = newLastFour.toString();
    bankData.accounts.checking.expiry = newExpiry;
    bankData.accounts.checking.status = 'active'; // Ensure card is active
    
    saveDataToStorage();
    updateAccountsDisplay();
    
    // Reset freeze button
    const freezeBtn = document.getElementById('freeze-card');
    if (freezeBtn) {
        freezeBtn.classList.remove('frozen');
        freezeBtn.innerHTML = '<i class="fas fa-snowflake"></i><span>Freeze</span>';
    }
    
    showToast('New card ordered! Will arrive in 5-7 business days. Your current card is now deactivated.', 'success');
}

function showAccountDetails(accountType) {
    const account = bankData.accounts[accountType];
    if (!account) return;
    
    let detailsHTML = '';
    
    if (accountType === 'checking') {
        detailsHTML = `
            <div class="account-details-modal">
                <div class="detail-row">
                    <span class="label">Account Type:</span>
                    <span class="value">Checking</span>
                </div>
                <div class="detail-row">
                    <span class="label">Account Number:</span>
                    <span class="value">${account.accountNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Routing Number:</span>
                    <span class="value">${account.routingNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Available Balance:</span>
                    <span class="value positive">$${account.balance.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value ${account.status === 'active' ? 'positive' : 'negative'}">
                        ${account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                    </span>
                </div>
                <div class="detail-row">
                    <span class="label">Opened:</span>
                    <span class="value">Jan 15, 2023</span>
                </div>
            </div>
        `;
    } else if (accountType === 'credit') {
        const dueDate = new Date(account.dueDate);
        detailsHTML = `
            <div class="account-details-modal">
                <div class="detail-row">
                    <span class="label">Card Type:</span>
                    <span class="value">Visa Credit</span>
                </div>
                <div class="detail-row">
                    <span class="label">Current Balance:</span>
                    <span class="value">$${account.balance.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Credit Limit:</span>
                    <span class="value">$${account.limit.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Available Credit:</span>
                    <span class="value positive">$${(account.limit - account.balance).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Payment Due Date:</span>
                    <span class="value">${dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Minimum Payment:</span>
                    <span class="value">$${account.minPayment.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">APR:</span>
                    <span class="value">${account.apr}%</span>
                </div>
            </div>
        `;
    }
    
    showConfirmationModal(
        `${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account Details`,
        detailsHTML,
        null,
        'info'
    );
}

function showAccountMenu(accountType) {
    const account = bankData.accounts[accountType];
    if (!account) return;
    
    let menuHTML = '';
    
    if (accountType === 'checking') {
        menuHTML = `
            <div class="account-menu-options">
                <button class="menu-option" data-action="view-statement">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <span>View Statement</span>
                </button>
                <button class="menu-option" data-action="transfer-funds">
                    <i class="fas fa-exchange-alt"></i>
                    <span>Transfer Funds</span>
                </button>
                <button class="menu-option" data-action="set-alerts">
                    <i class="fas fa-bell"></i>
                    <span>Set Alerts</span>
                </button>
                <button class="menu-option" data-action="close-account">
                    <i class="fas fa-times-circle"></i>
                    <span>Close Account</span>
                </button>
            </div>
        `;
    }
    
    showConfirmationModal(
        'Account Options',
        menuHTML,
        null,
        'custom'
    );
    
    // Add event listeners to menu options
    setTimeout(() => {
        document.querySelectorAll('.menu-option').forEach(option => {
            option.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                handleAccountMenuAction(accountType, action);
                hideModal();
            });
        });
    }, 100);
}

function handleAccountMenuAction(accountType, action) {
    switch(action) {
        case 'view-statement':
            showToast('Generating statement... This feature is not implemented in demo.', 'info');
            break;
        case 'transfer-funds':
            navigateToSection('#transactions');
            showToast('Transfer funds selected', 'info');
            break;
        case 'set-alerts':
            showToast('Alerts configuration - This feature is not implemented in demo.', 'info');
            break;
        case 'close-account':
            showConfirmationModal(
                'Close Account',
                'Are you sure you want to close this account? All funds will be transferred to your primary checking account.',
                function() {
                    closeAccount(accountType);
                }
            );
            break;
    }
}

function closeAccount(accountType) {
    const account = bankData.accounts[accountType];
    if (!account) return;
    
    // Transfer balance to checking
    if (account.balance > 0 && bankData.accounts.checking) {
        bankData.accounts.checking.balance += account.balance;
        
        // Add transaction record
        const transaction = {
            id: Date.now(),
            type: 'deposit',
            amount: account.balance,
            description: `Account closure - ${accountType}`,
            date: new Date(),
            balance: bankData.accounts.checking.balance
        };
        
        bankData.transactions.unshift(transaction);
    }
    
    // Remove account
    delete bankData.accounts[accountType];
    
    saveDataToStorage();
    updateAccountsDisplay();
    updateTotalBalance();
    
    showToast(`${accountType} account closed successfully.`, 'success');
}

// ===== LOCAL STORAGE FUNCTIONS =====
function loadDataFromStorage() {
    try {
        const savedData = localStorage.getItem('bankflow-data');
        
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            
            // Merge loaded data with defaults
            bankData.balance = parsedData.balance || 0;
            bankData.transactions = (parsedData.transactions || []).map(t => ({
                ...t,
                date: new Date(t.date)
            }));
            bankData.contactMessages = (parsedData.contactMessages || []).map(m => ({
                ...m,
                date: new Date(m.date)
            }));
            
            // Load settings if they exist
            if (parsedData.settings) {
                bankData.settings = { ...bankData.settings, ...parsedData.settings };
            }
            
            // Load stats if they exist
            if (parsedData.stats) {
                bankData.stats = { ...bankData.stats, ...parsedData.stats };
            }
            
            // Load accounts if they exist
            if (parsedData.accounts) {
                bankData.accounts = parsedData.accounts;
            }
            
            console.log('Data loaded from localStorage');
            
            // If no transactions exist, create initial demo data
            if (bankData.transactions.length === 0) {
                createInitialDemoData();
            }
        } else {
            createInitialDemoData();
        }
    } catch (error) {
        console.error("Error loading saved data:", error);
        showToast('Error loading saved data. Resetting to defaults.', 'error');
        createInitialDemoData();
    }
}

function createInitialDemoData() {
    console.log('Creating initial demo data...');
    
    // Set initial account data
    bankData.accounts = {
        checking: {
            id: 'CHK-4589-2104',
            balance: 12450.75,
            accountNumber: '4589210489324567',
            routingNumber: '021000021',
            type: 'checking',
            status: 'active',
            lastFour: '4567',
            expiry: '12/26'
        },
        savings: {
            id: 'SAV-7890-2341',
            balance: 8450.25,
            type: 'savings',
            status: 'active',
            apy: 2.5,
            goal: 10000,
            monthlyInterest: 17.60
        },
        credit: {
            id: 'CC-1234-5678',
            balance: 1245.50,
            type: 'credit',
            status: 'active',
            limit: 5000,
            dueDate: '2024-02-15',
            minPayment: 35.00,
            apr: 18.9
        }
    };
    
    // Calculate total balance
    bankData.balance = bankData.accounts.checking.balance + 
                       bankData.accounts.savings.balance - 
                       bankData.accounts.credit.balance;
    
    bankData.transactions = [
        { 
            id: Date.now() - 86400000 * 3, // 3 days ago
            type: 'deposit', 
            amount: 1000, 
            description: 'Initial Deposit', 
            date: new Date(Date.now() - 86400000 * 3), 
            balance: 1000 
        },
        { 
            id: Date.now() - 86400000 * 2, // 2 days ago
            type: 'deposit', 
            amount: 500, 
            description: 'Paycheck', 
            date: new Date(Date.now() - 86400000 * 2), 
            balance: 1500 
        },
        { 
            id: Date.now() - 86400000 * 1, // 1 day ago
            type: 'withdraw', 
            amount: 249.25, 
            description: 'Grocery Shopping', 
            date: new Date(Date.now() - 86400000 * 1), 
            balance: 1250.75 
        }
    ];
    
    bankData.contactMessages = [
        { 
            id: Date.now() - 86400000 * 4, // 4 days ago
            name: 'John Doe', 
            email: 'john@example.com', 
            subject: 'General Inquiry',
            message: 'I have a question about my account.', 
            date: new Date(Date.now() - 86400000 * 4) 
        }
    ];
    
    bankData.stats.lastBackup = null;
    
    saveDataToStorage();
}

function saveDataToStorage() {
    try {
        // Update stats before saving
        updateStats();
        
        localStorage.setItem('bankflow-data', JSON.stringify(bankData));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error("Error saving data:", error);
        showToast('Error saving data to browser storage', 'error');
    }
}

// ===== STATS FUNCTIONS =====
function updateStats() {
    // Update total transactions count
    bankData.stats.totalTransactions = bankData.transactions.length;
    
    // Calculate monthly stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = bankData.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    });
    
    const totalDeposits = monthlyTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = monthlyTransactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + t.amount, 0);
    
    bankData.stats.monthlyStats = {
        totalAmount: totalDeposits - totalWithdrawals,
        depositCount: monthlyTransactions.filter(t => t.type === 'deposit').length,
        withdrawalCount: monthlyTransactions.filter(t => t.type === 'withdraw').length,
        averageTransaction: monthlyTransactions.length > 0 
            ? monthlyTransactions.reduce((sum, t) => sum + t.amount, 0) / monthlyTransactions.length
            : 0,
        largestTransaction: monthlyTransactions.length > 0
            ? Math.max(...monthlyTransactions.map(t => t.amount))
            : 0,
        totalDeposits: totalDeposits,
        totalWithdrawals: totalWithdrawals
    };
}

// ===== LIMIT CALCULATIONS =====
function getTodayDeposits() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bankData.transactions
        .filter(t => t.type === 'deposit' && 
                     new Date(t.date).toDateString() === today.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTodayWithdrawals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bankData.transactions
        .filter(t => t.type === 'withdraw' && 
                     new Date(t.date).toDateString() === today.toDateString())
        .reduce((sum, t) => sum + t.amount, 0);
}

function canDeposit(amount) {
    const todayDeposits = getTodayDeposits();
    return todayDeposits + amount <= bankData.settings.dailyDepositLimit;
}

function canWithdraw(amount) {
    const todayWithdrawals = getTodayWithdrawals();
    return todayWithdrawals + amount <= bankData.settings.dailyWithdrawalLimit;
}

// ===== BANKING FUNCTIONS =====
function deposit(amount, description = 'Deposit') {
    amount = parseFloat(amount);
    
    // Validation
    const validation = validateTransaction(amount, 'deposit');
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return false;
    }
    
    // Check daily limit
    if (!canDeposit(amount)) {
        const todayDeposits = getTodayDeposits();
        const remaining = bankData.settings.dailyDepositLimit - todayDeposits;
        showToast(`Daily deposit limit exceeded. You can deposit up to $${remaining.toFixed(2)} more today.`, 'error');
        return false;
    }
    
    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Update checking account balance
    if (bankData.accounts.checking) {
        bankData.accounts.checking.balance += amount;
        bankData.accounts.checking.balance = Math.round(bankData.accounts.checking.balance * 100) / 100;
    }
    
    // Update total balance
    updateTotalBalance();
    
    // Create transaction record
    const transaction = {
        id: Date.now(),
        type: 'deposit',
        amount: amount,
        description: description,
        date: new Date(),
        balance: bankData.accounts.checking ? bankData.accounts.checking.balance : bankData.balance
    };
    
    // Add to transactions
    bankData.transactions.unshift(transaction);
    
    // Reset session timer
    resetSessionTimer();
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    updateUI();
    
    // Show success message
    showToast(`Successfully deposited $${amount.toFixed(2)}`, 'success');
    
    return true;
}

function withdraw(amount, description = 'Withdrawal') {
    amount = parseFloat(amount);
    
    // Validation
    const validation = validateTransaction(amount, 'withdraw');
    if (!validation.valid) {
        showToast(validation.message, 'error');
        return false;
    }
    
    // Check daily limit
    if (!canWithdraw(amount)) {
        const todayWithdrawals = getTodayWithdrawals();
        const remaining = bankData.settings.dailyWithdrawalLimit - todayWithdrawals;
        showToast(`Daily withdrawal limit exceeded. You can withdraw up to $${remaining.toFixed(2)} more today.`, 'error');
        return false;
    }
    
    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    
    // Check minimum balance after withdrawal
    if (bankData.accounts.checking && 
        bankData.accounts.checking.balance - amount < bankData.settings.minBalance) {
        showToast(`Account must maintain a minimum balance of $${bankData.settings.minBalance.toFixed(2)}`, 'error');
        return false;
    }
    
    // Update checking account balance
    if (bankData.accounts.checking) {
        bankData.accounts.checking.balance -= amount;
        bankData.accounts.checking.balance = Math.round(bankData.accounts.checking.balance * 100) / 100;
    }
    
    // Update total balance
    updateTotalBalance();
    
    // Create transaction record
    const transaction = {
        id: Date.now(),
        type: 'withdraw',
        amount: amount,
        description: description,
        date: new Date(),
        balance: bankData.accounts.checking ? bankData.accounts.checking.balance : bankData.balance
    };
    
    // Add to transactions
    bankData.transactions.unshift(transaction);
    
    // Reset session timer
    resetSessionTimer();
    
    // Save to localStorage
    saveDataToStorage();
    
    // Update UI
    updateUI();
    
    // Show success message
    showToast(`Successfully withdrew $${amount.toFixed(2)}`, 'success');
    
    return true;
}

function validateTransaction(amount, type) {
    if (isNaN(amount) || amount <= 0) {
        return { valid: false, message: 'Please enter a valid amount greater than 0' };
    }
    
    amount = Math.round(amount * 100) / 100;
    
    if (type === 'deposit') {
        if (amount > bankData.settings.maxDepositPerTransaction) {
            return { valid: false, message: `Maximum deposit amount is $${bankData.settings.maxDepositPerTransaction.toFixed(2)} per transaction` };
        }
    } else if (type === 'withdraw') {
        const availableBalance = bankData.accounts.checking ? bankData.accounts.checking.balance : bankData.balance;
        if (amount > availableBalance) {
            return { valid: false, message: 'Insufficient funds for this withdrawal' };
        }
    }
    
    return { valid: true, message: '' };
}

// ===== UI UPDATE FUNCTIONS =====
function updateUI() {
    updateBalanceDisplay();
    updateRecentTransactions();
    updateTransactionsList();
    updateTransactionSummary();
    updateContactMessages();
    updateLimitBars();
    updateStatsDisplay();
    updateMiniCards();
    updateAccountsDisplay();
    updateTotalBalance();
}

function updateBalanceDisplay() {
    // These are now handled by updateTotalBalance and updateAccountsDisplay
    const todayDeposits = getTodayDeposits();
    const todayWithdrawals = getTodayWithdrawals();
    
    document.getElementById('today-deposits').textContent = todayDeposits.toFixed(2);
    document.getElementById('today-withdrawals').textContent = todayWithdrawals.toFixed(2);
    document.getElementById('total-transactions-count').textContent = bankData.transactions.length;
    
    // Update monthly income/expenses in balance card
    updateMonthlyStats();
}

function updateMonthlyStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyDeposits = bankData.transactions
        .filter(t => t.type === 'deposit' && 
                     new Date(t.date).getMonth() === currentMonth && 
                     new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyWithdrawals = bankData.transactions
        .filter(t => t.type === 'withdraw' && 
                     new Date(t.date).getMonth() === currentMonth && 
                     new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Update monthly income/expenses in mini cards
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    
    if (monthlyIncomeEl) monthlyIncomeEl.textContent = `$${monthlyDeposits.toFixed(2)}`;
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = `$${monthlyWithdrawals.toFixed(2)}`;
    
    // Update balance change indicator
    const balanceChangeEl = document.querySelector('.balance-change');
    if (balanceChangeEl && bankData.transactions.length > 0) {
        const latestTransaction = bankData.transactions[0];
        const change = latestTransaction.type === 'deposit' ? latestTransaction.amount : -latestTransaction.amount;
        balanceChangeEl.textContent = `${change >= 0 ? '+' : '-'}$${Math.abs(change).toFixed(2)}`;
        balanceChangeEl.className = `balance-change ${change >= 0 ? 'positive' : 'negative'}`;
    }
}

function updateMiniCards() {
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const monthlyExpensesEl = document.getElementById('monthly-expenses');
    
    if (!monthlyIncomeEl || !monthlyExpensesEl) return;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyDeposits = bankData.transactions
        .filter(t => t.type === 'deposit' && 
                     new Date(t.date).getMonth() === currentMonth && 
                     new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyWithdrawals = bankData.transactions
        .filter(t => t.type === 'withdraw' && 
                     new Date(t.date).getMonth() === currentMonth && 
                     new Date(t.date).getFullYear() === currentYear)
        .reduce((sum, t) => sum + t.amount, 0);
    
    monthlyIncomeEl.textContent = `$${monthlyDeposits.toFixed(2)}`;
    monthlyExpensesEl.textContent = `$${monthlyWithdrawals.toFixed(2)}`;
}

function updateRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    container.innerHTML = '';
    
    const recentTransactions = bankData.transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Make your first deposit!</p>';
        return;
    }
    
    recentTransactions.forEach(transaction => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconType = transaction.type === 'deposit' ? 'deposit' : 'withdraw';
        const iconClass = transaction.type === 'deposit' ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
        const amountClass = transaction.type === 'deposit' ? 'positive' : 'negative';
        const amountSign = transaction.type === 'deposit' ? '+' : '-';
        
        const dateFormatted = new Date(transaction.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        activityItem.innerHTML = `
            <div class="activity-icon ${iconType}">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-title">${transaction.description}</div>
                <div class="activity-time">${dateFormatted}</div>
            </div>
            <div class="activity-amount ${amountClass}">${amountSign}$${transaction.amount.toFixed(2)}</div>
        `;
        
        container.appendChild(activityItem);
    });
}

function updateTransactionsList(filterType = 'all', sortBy = 'newest') {
    const container = document.getElementById('transactions-list');
    if (!container) return;
    
    // Filter transactions
    let filteredTransactions = [...bankData.transactions];
    
    if (filterType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === filterType);
    }
    
    // Sort transactions
    filteredTransactions.sort((a, b) => {
        switch (sortBy) {
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'amount-high':
                return b.amount - a.amount;
            case 'amount-low':
                return a.amount - b.amount;
            case 'newest':
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    // Clear and update container
    container.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">No transactions found.</td>
            </tr>
        `;
        return;
    }
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        const dateFormatted = new Date(transaction.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const timeFormatted = new Date(transaction.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const typeClass = transaction.type === 'deposit' ? 'type-deposit' : 'type-withdraw';
        const typeText = transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal';
        const amountSign = transaction.type === 'deposit' ? '+' : '-';
        
        row.innerHTML = `
            <td>${dateFormatted}<br><small>${timeFormatted}</small></td>
            <td>${transaction.description}</td>
            <td><span class="transaction-type ${typeClass}">${typeText}</span></td>
            <td class="${transaction.type === 'deposit' ? 'positive' : 'negative'}">${amountSign}$${transaction.amount.toFixed(2)}</td>
            <td>$${transaction.balance.toFixed(2)}</td>
        `;
        
        container.appendChild(row);
    });
}

function updateTransactionSummary() {
    const totalDeposits = bankData.transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = bankData.transactions
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netChange = totalDeposits - totalWithdrawals;
    
    const depositValueEl = document.querySelector('.deposit-value');
    const withdrawValueEl = document.querySelector('.withdraw-value');
    const netValueEl = document.querySelector('.net-value');
    
    if (depositValueEl) depositValueEl.textContent = `$${totalDeposits.toFixed(2)}`;
    if (withdrawValueEl) withdrawValueEl.textContent = `$${totalWithdrawals.toFixed(2)}`;
    if (netValueEl) {
        netValueEl.textContent = `$${netChange.toFixed(2)}`;
        netValueEl.className = `summary-value ${netChange >= 0 ? 'positive' : 'negative'}`;
    }
}

function updateStatsDisplay() {
    updateStats();
    
    const monthlyStats = bankData.stats.monthlyStats;
    
    const elements = {
        'this-month-total': `$${monthlyStats.totalAmount.toFixed(2)}`,
        'avg-transaction': `$${monthlyStats.averageTransaction.toFixed(2)}`,
        'largest-transaction': `$${monthlyStats.largestTransaction.toFixed(2)}`
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function updateLimitBars() {
    const todayDeposits = getTodayDeposits();
    const todayWithdrawals = getTodayWithdrawals();
    
    const depositLimitPercent = (todayDeposits / bankData.settings.dailyDepositLimit) * 100;
    const withdrawalLimitPercent = (todayWithdrawals / bankData.settings.dailyWithdrawalLimit) * 100;
    
    const depositFill = document.getElementById('deposit-limit-fill');
    const withdrawalFill = document.getElementById('withdrawal-limit-fill');
    
    if (depositFill) {
        depositFill.style.width = `${Math.min(depositLimitPercent, 100)}%`;
        depositFill.setAttribute('aria-valuenow', Math.min(depositLimitPercent, 100));
    }
    
    if (withdrawalFill) {
        withdrawalFill.style.width = `${Math.min(withdrawalLimitPercent, 100)}%`;
        withdrawalFill.setAttribute('aria-valuenow', Math.min(withdrawalLimitPercent, 100));
    }
}

function updateContactMessages() {
    const container = document.getElementById('contact-messages');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bankData.contactMessages.length === 0) {
        container.innerHTML = '<p class="empty-state">No messages sent yet.</p>';
        return;
    }
    
    const recentMessages = bankData.contactMessages.slice(0, 3);
    
    recentMessages.forEach(message => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        
        const dateFormatted = new Date(message.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-sender">${message.name}</span>
                <span class="message-date">${dateFormatted}</span>
            </div>
            <div class="message-content">
                <strong>${message.subject}</strong><br>
                ${message.message.substring(0, 80)}${message.message.length > 80 ? '...' : ''}
            </div>
        `;
        
        container.appendChild(messageElement);
    });
}

function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function updateCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// ===== FORM HANDLING =====
function setupForms() {
    // Deposit form
    const depositForm = document.getElementById('deposit-form');
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amountInput = document.getElementById('deposit-amount');
            const descriptionInput = document.getElementById('deposit-description');
            
            const amount = parseFloat(amountInput.value);
            const description = descriptionInput.value.trim() || 'Deposit';
            
            if (deposit(amount, description)) {
                depositForm.reset();
                navigateToSection('#dashboard');
            }
        });
        
        // Quick amount buttons for deposit
        document.querySelectorAll('.quick-amount-btn').forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                const amountInput = document.getElementById('deposit-amount');
                if (amountInput) {
                    amountInput.value = amount;
                    amountInput.focus();
                }
            });
        });
    }
    
    // Withdraw form
    const withdrawForm = document.getElementById('withdraw-form');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const amountInput = document.getElementById('withdraw-amount');
            const descriptionInput = document.getElementById('withdraw-description');
            
            const amount = parseFloat(amountInput.value);
            const description = descriptionInput.value.trim() || 'Withdrawal';
            
            if (withdraw(amount, description)) {
                withdrawForm.reset();
                navigateToSection('#dashboard');
            }
        });
        
        // Quick amount buttons for withdraw
        document.querySelectorAll('.quick-amount-grid .quick-amount-btn').forEach(button => {
            button.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                const amountInput = document.getElementById('withdraw-amount');
                if (amountInput) {
                    amountInput.value = amount;
                    amountInput.focus();
                }
            });
        });
    }
    
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('contact-name');
            const emailInput = document.getElementById('contact-email');
            const subjectInput = document.getElementById('contact-subject');
            const messageInput = document.getElementById('contact-message');
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const subject = subjectInput.value;
            const message = messageInput.value.trim();
            
            // Validation
            if (!name || !email || !subject || !message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }
            
            // Create message record
            const messageRecord = {
                id: Date.now(),
                name: name,
                email: email,
                subject: subject,
                message: message,
                date: new Date()
            };
            
            // Add to messages
            bankData.contactMessages.unshift(messageRecord);
            
            // Save to localStorage
            saveDataToStorage();
            
            // Reset session timer
            resetSessionTimer();
            
            // Update UI
            updateContactMessages();
            
            // Show success message
            showToast('Your message has been sent successfully! (Note: This is a demo - no actual email is sent)', 'success');
            
            // Reset form
            contactForm.reset();
        });
    }
    
    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            navigateToSection('#dashboard');
        });
    });
}

// ===== BUTTON SETUP =====
function setupButtons() {
    // Export CSV button
    const exportCSVBtn = document.getElementById('export-transactions');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportToCSV);
    }
    
    // Clear transaction history
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Clear Transaction History',
                'Are you sure you want to clear all transaction history? This action cannot be undone.',
                clearTransactionHistory
            );
        });
    }
    
    // Clear contact messages
    const clearMessagesBtn = document.getElementById('clear-messages');
    if (clearMessagesBtn) {
        clearMessagesBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Clear Messages',
                'Are you sure you want to clear all contact messages?',
                clearContactMessages
            );
        });
    }
}

function setupQuickWithdrawals() {
    const quickAmounts = document.querySelectorAll('.quick-withdrawals .quick-amount');
    quickAmounts.forEach(button => {
        button.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            const amountInput = document.getElementById('withdraw-amount');
            if (amountInput) {
                amountInput.value = amount;
                amountInput.focus();
            }
        });
    });
}

// ===== DATA MANAGEMENT =====
function setupDataManagement() {
    // Import data button
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    
    if (importBtn && importFile) {
        importBtn.addEventListener('click', function() {
            importFile.click();
        });
        
        importFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                importData(file);
            }
            this.value = ''; // Reset file input
        });
    }
    
    // Reset all data button
    const resetBtn = document.getElementById('reset-all-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            showConfirmationModal(
                'Reset All Data',
                'Are you sure you want to reset ALL data? This will clear everything and cannot be undone.',
                function() {
                    localStorage.removeItem('bankflow-data');
                    createInitialDemoData();
                    updateUI();
                    navigateToSection('#dashboard');
                    showToast('All data has been reset to defaults', 'success');
                }
            );
        });
    }
    
    // Update last backup display
    const lastBackupElement = document.getElementById('last-backup');
    if (lastBackupElement && bankData.stats.lastBackup) {
        lastBackupElement.textContent = new Date(bankData.stats.lastBackup).toLocaleString();
    } else if (lastBackupElement) {
        lastBackupElement.textContent = 'Never';
    }
}

// ===== EXPORT/IMPORT FUNCTIONS =====
function exportToCSV() {
    if (bankData.transactions.length === 0) {
        showToast('No transactions to export', 'info');
        return;
    }
    
    let csv = 'Date,Description,Type,Amount,Balance\n';
    
    bankData.transactions.forEach(transaction => {
        const date = new Date(transaction.date).toLocaleDateString();
        const description = `"${transaction.description.replace(/"/g, '""')}"`;
        const type = transaction.type;
        const amount = transaction.amount.toFixed(2);
        const balance = transaction.balance.toFixed(2);
        
        csv += `${date},${description},${type},${amount},${balance}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bankflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Transactions exported to CSV successfully', 'success');
}

function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data structure
            if (typeof importedData.balance === 'undefined' || !Array.isArray(importedData.transactions)) {
                throw new Error('Invalid data format');
            }
            
            // Show confirmation modal
            showConfirmationModal(
                'Import Data',
                `This will replace all current data with imported data. 
                This includes ${importedData.transactions.length} transactions.
                Are you sure you want to continue?`,
                function() {
                    // Update bankData
                    bankData.balance = importedData.balance;
                    bankData.transactions = (importedData.transactions || []).map(t => ({
                        ...t,
                        date: new Date(t.date)
                    }));
                    bankData.contactMessages = (importedData.contactMessages || []).map(m => ({
                        ...m,
                        date: new Date(m.date)
                    }));
                    
                    if (importedData.settings) {
                        bankData.settings = { ...bankData.settings, ...importedData.settings };
                    }
                    
                    if (importedData.stats) {
                        bankData.stats = { ...bankData.stats, ...importedData.stats };
                    }
                    
                    if (importedData.accounts) {
                        bankData.accounts = importedData.accounts;
                    }
                    
                    // Save to localStorage
                    saveDataToStorage();
                    
                    // Update UI
                    updateUI();
                    
                    showToast('Data imported successfully', 'success');
                }
            );
        } catch (error) {
            console.error('Import error:', error);
            showToast('Error importing data: Invalid file format', 'error');
        }
    };
    
    reader.readAsText(file);
}

// ===== CLEAR FUNCTIONS =====
function clearTransactionHistory() {
    // Keep only the initial demo transactions
    bankData.transactions = bankData.transactions.slice(-3); // Keep last 3 (demo data)
    
    // Reset account balances to demo values
    if (bankData.accounts) {
        bankData.accounts.checking.balance = 12450.75;
        bankData.accounts.savings.balance = 8450.25;
        bankData.accounts.credit.balance = 1245.50;
    }
    
    saveDataToStorage();
    updateUI();
    showToast('Transaction history cleared (demo data kept)', 'success');
}

function clearContactMessages() {
    bankData.contactMessages = [];
    saveDataToStorage();
    updateUI();
    showToast('Contact messages cleared', 'success');
}

// ===== NAVIGATION =====
function setupNavigation() {
    // Navbar links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            navigateToSection(targetId);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Hamburger menu for mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburger.contains(event.target) && !navMenu.contains(event.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}

function setupQuickActions() {
    const actionButtons = document.querySelectorAll('.action-card');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                navigateToSection(targetId);
                
                // Update active nav link
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === targetId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

function navigateToSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.querySelector(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Reset session timer
        resetSessionTimer();
        
        // Scroll to top of section
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// ===== FILTERS & SORTING =====
function setupFilters() {
    const filterSelect = document.getElementById('filter-type');
    const sortSelect = document.getElementById('transaction-sort');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            updateTransactionsList(
                this.value,
                sortSelect ? sortSelect.value : 'newest'
            );
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            updateTransactionsList(
                filterSelect ? filterSelect.value : 'all',
                this.value
            );
        });
    }
}

// ===== MODAL SYSTEM =====
function setupModal() {
    const modal = document.getElementById('confirmation-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', hideModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            hideModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideModal();
        }
    });
}

let confirmCallback = null;

function showConfirmationModal(title, message, callback, type = 'confirm') {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = modal.querySelector('.modal-header h3');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) {
        if (type === 'custom') {
            modalMessage.innerHTML = message;
        } else {
            modalMessage.textContent = message;
        }
    }
    
    // Set button text based on type
    if (type === 'info') {
        confirmBtn.textContent = 'OK';
        cancelBtn.style.display = 'none';
    } else {
        confirmBtn.textContent = 'Confirm';
        cancelBtn.style.display = 'inline-block';
    }
    
    confirmCallback = callback;
    
    // Remove previous event listener
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Add new event listener
    newConfirmBtn.addEventListener('click', function() {
        if (confirmCallback) {
            confirmCallback();
        }
        hideModal();
    });
    
    modal.classList.add('show');
}

function hideModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('show');
    confirmCallback = null;
}

// ===== SESSION TIMER =====
function setupSessionTimer() {
    const timerElement = document.getElementById('session-timer');
    if (!timerElement) return;
    
    // Reset timer on user interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, resetSessionTimer);
    });
    
    startSessionTimer();
}

function startSessionTimer() {
    clearInterval(sessionTimer);
    
    sessionTimer = setInterval(() => {
        sessionTimeLeft--;
        
        updateTimerDisplay();
        
        if (sessionTimeLeft <= 0) {
            clearInterval(sessionTimer);
            handleSessionTimeout();
        }
    }, 1000);
}

function resetSessionTimer() {
    sessionTimeLeft = bankData.settings.sessionTimeout;
    updateTimerDisplay();
    startSessionTimer();
}

function updateTimerDisplay() {
    const minutes = Math.floor(sessionTimeLeft / 60);
    const seconds = sessionTimeLeft % 60;
    
    const minutesElement = document.getElementById('timer-minutes');
    const secondsElement = document.getElementById('timer-seconds');
    
    if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
    if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
    
    // Change color when time is running low
    const timerElement = document.getElementById('session-timer');
    if (timerElement) {
        if (sessionTimeLeft < 300) { // Less than 5 minutes
            timerElement.style.background = 'rgba(220, 53, 69, 0.9)';
        } else if (sessionTimeLeft < 600) { // Less than 10 minutes
            timerElement.style.background = 'rgba(255, 193, 7, 0.9)';
        } else {
            timerElement.style.background = 'rgba(0, 0, 0, 0.8)';
        }
    }
}

function handleSessionTimeout() {
    showToast('Session expired due to inactivity. Please refresh the page.', 'error');
    
    // Show timeout message
    const timerElement = document.getElementById('session-timer');
    if (timerElement) {
        timerElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Session Expired';
        timerElement.style.background = 'rgba(220, 53, 69, 0.9)';
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    const toastClose = toast.querySelector('.toast-close');
    
    if (!toast || !toastIcon || !toastMessage) return;
    
    // Set message and type
    toastMessage.textContent = message;
    
    // Set icon based on type
    let iconClass = '';
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
        toast.className = 'toast toast-success';
    } else if (type === 'error') {
        iconClass = 'fas fa-exclamation-circle';
        toast.className = 'toast toast-error';
    } else {
        iconClass = 'fas fa-info-circle';
        toast.className = 'toast toast-info';
    }
    
    toastIcon.className = `toast-icon ${iconClass}`;
    
    // Remove previous event listeners
    const newToastClose = toastClose.cloneNode(true);
    toastClose.parentNode.replaceChild(newToastClose, toastClose);
    
    // Add close button functionality
    newToastClose.addEventListener('click', function() {
        toast.classList.remove('show');
    });
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// ===== UTILITY FUNCTIONS =====
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// ===== WINDOW UNLOAD WARNING =====
window.addEventListener('beforeunload', function(e) {
    // Check if there are unsaved changes (for forms)
    const depositForm = document.getElementById('deposit-form');
    const withdrawForm = document.getElementById('withdraw-form');
    const contactForm = document.getElementById('contact-form');
    
    const hasUnsavedChanges = 
        (depositForm && Array.from(depositForm.elements).some(el => el.value && !el.disabled && el.type !== 'button' && el.type !== 'submit')) ||
        (withdrawForm && Array.from(withdrawForm.elements).some(el => el.value && !el.disabled && el.type !== 'button' && el.type !== 'submit')) ||
        (contactForm && Array.from(contactForm.elements).some(el => el.value && !el.disabled && el.type !== 'button' && el.type !== 'submit'));
    
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
});

// ===== INITIAL DATA CHECK =====
// Check if this is first visit
if (!localStorage.getItem('bankflow-first-visit')) {
    showToast('Welcome to BankFlow! This is a demo banking application. Data is stored locally in your browser.', 'info');
    localStorage.setItem('bankflow-first-visit', 'true');
}

// ===== ERROR HANDLING =====
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', { message, source, lineno, colno, error });
    showToast('An unexpected error occurred. Please refresh the page.', 'error');
    return false;
};

// ===== PUBLIC API (for browser console testing) =====
window.BankFlow = {
    getBalance: () => bankData.balance,
    getTransactions: () => bankData.transactions,
    getAccounts: () => bankData.accounts,
    deposit: deposit,
    withdraw: withdraw,
    payCreditCard: payCreditCardBill,
    resetData: createInitialDemoData,
    exportData: exportToCSV,
    showToast: showToast
};

console.log('BankFlow API available at window.BankFlow');