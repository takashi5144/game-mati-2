// 市場UI
export class MarketUI {
    constructor(uiManager, economySystem) {
        this.uiManager = uiManager;
        this.economySystem = economySystem;
        this.isOpen = false;
        this.selectedTab = 'buy';
        this.selectedResource = null;
        this.selectedMerchant = null;
    }
    
    init() {
        this.createUI();
        this.setupEventListeners();
        this.addStyles();
    }
    
    createUI() {
        const window = document.createElement('div');
        window.id = 'market-window';
        window.className = 'game-window market-window hidden';
        window.innerHTML = `
            <div class="window-header">
                <h2>市場</h2>
                <button class="window-close">×</button>
            </div>
            <div class="window-tabs">
                <button class="tab-btn active" data-tab="buy">購入</button>
                <button class="tab-btn" data-tab="sell">売却</button>
                <button class="tab-btn" data-tab="merchants">商人</button>
                <button class="tab-btn" data-tab="stats">統計</button>
            </div>
            <div class="window-content">
                <div id="market-tab-buy" class="tab-content active">
                    <div class="resource-grid" id="buy-resources"></div>
                </div>
                <div id="market-tab-sell" class="tab-content">
                    <div class="resource-grid" id="sell-resources"></div>
                </div>
                <div id="market-tab-merchants" class="tab-content">
                    <div class="merchant-list" id="merchant-list"></div>
                </div>
                <div id="market-tab-stats" class="tab-content">
                    <div class="economy-stats" id="economy-stats"></div>
                </div>
            </div>
            
            <!-- 取引ダイアログ -->
            <div id="trade-dialog" class="trade-dialog hidden">
                <div class="dialog-header">
                    <h3 id="trade-title">取引</h3>
                    <button class="dialog-close">×</button>
                </div>
                <div class="dialog-content">
                    <div class="trade-info">
                        <div class="resource-icon" id="trade-resource-icon">🌾</div>
                        <div class="resource-name" id="trade-resource-name">小麦</div>
                        <div class="price-info">
                            <span class="price-label">価格:</span>
                            <span class="price-value" id="trade-price">10</span>
                            <span class="price-unit">G/個</span>
                        </div>
                    </div>
                    <div class="trade-controls">
                        <label>数量:</label>
                        <input type="range" id="trade-amount" min="1" max="100" value="1">
                        <input type="number" id="trade-amount-input" min="1" max="100" value="1">
                    </div>
                    <div class="trade-summary">
                        <div class="summary-row">
                            <span>小計:</span>
                            <span id="trade-subtotal">10G</span>
                        </div>
                        <div class="summary-row">
                            <span>税金 (10%):</span>
                            <span id="trade-tax">1G</span>
                        </div>
                        <div class="summary-row total">
                            <span>合計:</span>
                            <span id="trade-total">11G</span>
                        </div>
                    </div>
                    <div class="trade-actions">
                        <button id="trade-confirm" class="btn btn-primary">確認</button>
                        <button id="trade-cancel" class="btn btn-secondary">キャンセル</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(window);
        this.window = window;
        this.tradeDialog = document.getElementById('trade-dialog');
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .market-window {
                width: 800px;
                height: 600px;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(20, 20, 30, 0.95);
                border: 2px solid #444;
                border-radius: 8px;
                z-index: 1000;
            }
            
            .resource-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .resource-card {
                background: rgba(40, 40, 50, 0.8);
                border: 2px solid #555;
                border-radius: 8px;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s;
                text-align: center;
            }
            
            .resource-card:hover {
                background: rgba(50, 50, 60, 0.9);
                border-color: #00ff88;
                transform: translateY(-2px);
            }
            
            .resource-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            
            .resource-name {
                font-size: 16px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
            }
            
            .resource-price {
                font-size: 14px;
                color: #00ff88;
                margin-bottom: 5px;
            }
            
            .resource-stock {
                font-size: 12px;
                color: #ccc;
            }
            
            .price-trend {
                font-size: 12px;
                margin-top: 5px;
            }
            
            .trend-up {
                color: #ff4444;
            }
            
            .trend-down {
                color: #44ff44;
            }
            
            .trend-stable {
                color: #ffff44;
            }
            
            .merchant-list {
                padding: 20px;
            }
            
            .merchant-card {
                background: rgba(40, 40, 50, 0.8);
                border: 2px solid #555;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .merchant-card:hover {
                background: rgba(50, 50, 60, 0.9);
                border-color: #00ff88;
            }
            
            .merchant-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .merchant-name {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
            }
            
            .merchant-type {
                font-size: 14px;
                color: #00ff88;
                background: rgba(0, 255, 136, 0.2);
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .merchant-info {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                font-size: 14px;
                color: #ccc;
            }
            
            .merchant-inventory {
                margin-top: 10px;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .inventory-item {
                background: rgba(60, 60, 70, 0.8);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
            
            .economy-stats {
                padding: 20px;
            }
            
            .stat-section {
                background: rgba(40, 40, 50, 0.8);
                border: 1px solid #555;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
            }
            
            .stat-title {
                font-size: 16px;
                font-weight: bold;
                color: #00ff88;
                margin-bottom: 10px;
            }
            
            .stat-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                font-size: 14px;
            }
            
            .stat-label {
                color: #ccc;
            }
            
            .stat-value {
                color: #fff;
                font-weight: bold;
            }
            
            .trade-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(30, 30, 40, 0.98);
                border: 2px solid #00ff88;
                border-radius: 8px;
                padding: 20px;
                min-width: 400px;
                z-index: 1100;
                box-shadow: 0 8px 32px rgba(0, 255, 136, 0.3);
            }
            
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .dialog-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
            }
            
            .trade-info {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .trade-controls {
                margin-bottom: 20px;
            }
            
            .trade-controls label {
                display: block;
                margin-bottom: 10px;
                color: #ccc;
            }
            
            .trade-controls input[type="range"] {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .trade-controls input[type="number"] {
                width: 100%;
                padding: 8px;
                background: rgba(50, 50, 60, 0.8);
                border: 1px solid #555;
                color: #fff;
                border-radius: 4px;
            }
            
            .trade-summary {
                background: rgba(40, 40, 50, 0.8);
                border-radius: 4px;
                padding: 15px;
                margin-bottom: 20px;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                color: #ccc;
            }
            
            .summary-row.total {
                border-top: 1px solid #555;
                padding-top: 8px;
                margin-top: 8px;
                font-weight: bold;
                color: #fff;
            }
            
            .trade-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .transaction-list {
                max-height: 200px;
                overflow-y: auto;
                font-size: 12px;
            }
            
            .transaction-item {
                padding: 5px;
                border-bottom: 1px solid #333;
                color: #ccc;
            }
            
            .transaction-buy {
                color: #ff6666;
            }
            
            .transaction-sell {
                color: #66ff66;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        // ウィンドウの閉じるボタン
        this.window.querySelector('.window-close').addEventListener('click', () => {
            this.close();
        });
        
        // タブ切り替え
        this.window.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
        
        // ダイアログの閉じるボタン
        this.tradeDialog.querySelector('.dialog-close').addEventListener('click', () => {
            this.closeTradeDialog();
        });
        
        // 取引コントロール
        const amountSlider = document.getElementById('trade-amount');
        const amountInput = document.getElementById('trade-amount-input');
        
        amountSlider.addEventListener('input', (e) => {
            amountInput.value = e.target.value;
            this.updateTradeSummary();
        });
        
        amountInput.addEventListener('input', (e) => {
            amountSlider.value = e.target.value;
            this.updateTradeSummary();
        });
        
        // 取引ボタン
        document.getElementById('trade-confirm').addEventListener('click', () => {
            this.confirmTrade();
        });
        
        document.getElementById('trade-cancel').addEventListener('click', () => {
            this.closeTradeDialog();
        });
    }
    
    open() {
        this.isOpen = true;
        this.window.classList.remove('hidden');
        this.refresh();
        
        // イベントを発火
        window.dispatchEvent(new CustomEvent('marketOpened'));
    }
    
    close() {
        this.isOpen = false;
        this.window.classList.add('hidden');
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    switchTab(tab) {
        this.selectedTab = tab;
        
        // タブボタンの状態を更新
        this.window.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // タブコンテンツの表示を更新
        this.window.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `market-tab-${tab}`);
        });
        
        this.refresh();
    }
    
    refresh() {
        switch (this.selectedTab) {
            case 'buy':
                this.refreshBuyTab();
                break;
            case 'sell':
                this.refreshSellTab();
                break;
            case 'merchants':
                this.refreshMerchantsTab();
                break;
            case 'stats':
                this.refreshStatsTab();
                break;
        }
    }
    
    refreshBuyTab() {
        const container = document.getElementById('buy-resources');
        container.innerHTML = '';
        
        for (const [resource, price] of this.economySystem.marketPrices.entries()) {
            const card = this.createResourceCard(resource, price, 'buy');
            container.appendChild(card);
        }
    }
    
    refreshSellTab() {
        const container = document.getElementById('sell-resources');
        container.innerHTML = '';
        
        // プレイヤーが持っているリソースのみ表示
        const resources = this.uiManager.game.resourceManager.resources;
        
        for (const [resource, data] of resources.entries()) {
            if (data.current > 0) {
                const price = this.economySystem.marketPrices.get(resource) || 0;
                const card = this.createResourceCard(resource, price, 'sell', data.current);
                container.appendChild(card);
            }
        }
    }
    
    refreshMerchantsTab() {
        const container = document.getElementById('merchant-list');
        container.innerHTML = '';
        
        const activeMerchants = this.economySystem.merchants.filter(m => 
            m.departureTime > (this.uiManager.game.timeSystem?.currentDay || 0)
        );
        
        if (activeMerchants.length === 0) {
            container.innerHTML = '<div class="empty-message">現在、商人はいません</div>';
            return;
        }
        
        activeMerchants.forEach(merchant => {
            const card = this.createMerchantCard(merchant);
            container.appendChild(card);
        });
    }
    
    refreshStatsTab() {
        const container = document.getElementById('economy-stats');
        const stats = this.economySystem.getEconomyStats();
        
        container.innerHTML = `
            <div class="stat-section">
                <div class="stat-title">取引統計</div>
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-label">総取引数:</span>
                        <span class="stat-value">${stats.totalTransactions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">総収入:</span>
                        <span class="stat-value">${stats.totalRevenue}G</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">総支出:</span>
                        <span class="stat-value">${stats.totalExpenses}G</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">収支:</span>
                        <span class="stat-value ${stats.tradeBalance >= 0 ? 'positive' : 'negative'}">
                            ${stats.tradeBalance >= 0 ? '+' : ''}${stats.tradeBalance}G
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="stat-section">
                <div class="stat-title">価格動向</div>
                <div class="price-trends">
                    ${this.createPriceTrendsHTML(stats.priceTrends)}
                </div>
            </div>
            
            <div class="stat-section">
                <div class="stat-title">最近の取引</div>
                <div class="transaction-list">
                    ${this.createTransactionListHTML(stats.recentTransactions)}
                </div>
            </div>
        `;
    }
    
    createResourceCard(resource, price, mode, stock = null) {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.dataset.resource = resource;
        card.dataset.mode = mode;
        
        const icon = this.getResourceIcon(resource);
        const name = this.getResourceName(resource);
        const trend = this.getPriceTrend(resource);
        
        card.innerHTML = `
            <div class="resource-icon">${icon}</div>
            <div class="resource-name">${name}</div>
            <div class="resource-price">${price}G</div>
            ${stock !== null ? `<div class="resource-stock">在庫: ${Math.floor(stock)}</div>` : ''}
            <div class="price-trend ${trend.class}">${trend.text}</div>
        `;
        
        card.addEventListener('click', () => {
            this.openTradeDialog(resource, mode);
        });
        
        return card;
    }
    
    createMerchantCard(merchant) {
        const card = document.createElement('div');
        card.className = 'merchant-card';
        card.dataset.merchantId = merchant.id;
        
        const specializationName = this.getSpecializationName(merchant.specialization);
        const remainingDays = merchant.departureTime - (this.uiManager.game.timeSystem?.currentDay || 0);
        
        card.innerHTML = `
            <div class="merchant-header">
                <div class="merchant-name">${merchant.name}</div>
                <div class="merchant-type">${specializationName}</div>
            </div>
            <div class="merchant-info">
                <div>資金: ${Math.floor(merchant.money)}G</div>
                <div>滞在: あと${remainingDays}日</div>
                <div>評判: ${merchant.reputation}</div>
                <div>価格: ${Math.round(merchant.priceModifier * 100)}%</div>
            </div>
            <div class="merchant-inventory">
                ${this.createMerchantInventoryHTML(merchant)}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.selectedMerchant = merchant;
            this.showMerchantDetails(merchant);
        });
        
        return card;
    }
    
    createMerchantInventoryHTML(merchant) {
        let html = '';
        for (const [resource, amount] of merchant.inventory.entries()) {
            if (amount > 0) {
                const icon = this.getResourceIcon(resource);
                html += `<div class="inventory-item">${icon} ${amount}</div>`;
            }
        }
        return html;
    }
    
    createPriceTrendsHTML(trends) {
        let html = '<div class="stat-grid">';
        for (const [resource, trend] of trends.entries()) {
            const icon = this.getResourceIcon(resource);
            const name = this.getResourceName(resource);
            const trendClass = trend.trend === 'up' ? 'trend-up' : 
                              trend.trend === 'down' ? 'trend-down' : 'trend-stable';
            const arrow = trend.trend === 'up' ? '↑' : 
                         trend.trend === 'down' ? '↓' : '→';
            
            html += `
                <div class="stat-item">
                    <span class="stat-label">${icon} ${name}:</span>
                    <span class="stat-value ${trendClass}">
                        ${trend.current}G ${arrow} ${trend.change >= 0 ? '+' : ''}${trend.change.toFixed(1)}%
                    </span>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
    
    createTransactionListHTML(transactions) {
        if (transactions.length === 0) {
            return '<div class="empty-message">取引履歴なし</div>';
        }
        
        let html = '';
        transactions.reverse().forEach(transaction => {
            const icon = this.getResourceIcon(transaction.resource);
            const name = this.getResourceName(transaction.resource);
            const typeClass = transaction.type === 'buy' ? 'transaction-buy' : 'transaction-sell';
            const typeText = transaction.type === 'buy' ? '購入' : '売却';
            
            html += `
                <div class="transaction-item ${typeClass}">
                    ${typeText}: ${icon} ${name} x${transaction.amount} - ${transaction.total}G
                </div>
            `;
        });
        return html;
    }
    
    openTradeDialog(resource, mode) {
        this.selectedResource = resource;
        this.tradeMode = mode;
        
        const price = this.economySystem.marketPrices.get(resource) || 0;
        const icon = this.getResourceIcon(resource);
        const name = this.getResourceName(resource);
        
        document.getElementById('trade-title').textContent = mode === 'buy' ? '購入' : '売却';
        document.getElementById('trade-resource-icon').textContent = icon;
        document.getElementById('trade-resource-name').textContent = name;
        document.getElementById('trade-price').textContent = price;
        
        // 数量の最大値を設定
        let maxAmount = 100;
        if (mode === 'sell') {
            const available = this.uiManager.game.resourceManager.getResource(resource);
            maxAmount = Math.floor(available);
        } else {
            const money = this.uiManager.game.resourceManager.getResource('money');
            maxAmount = Math.min(100, Math.floor(money / (price * 1.1))); // 税込み
        }
        
        document.getElementById('trade-amount').max = maxAmount;
        document.getElementById('trade-amount-input').max = maxAmount;
        document.getElementById('trade-amount').value = 1;
        document.getElementById('trade-amount-input').value = 1;
        
        this.updateTradeSummary();
        this.tradeDialog.classList.remove('hidden');
    }
    
    closeTradeDialog() {
        this.tradeDialog.classList.add('hidden');
        this.selectedResource = null;
        this.selectedMerchant = null;
    }
    
    updateTradeSummary() {
        const amount = parseInt(document.getElementById('trade-amount').value);
        const price = this.economySystem.marketPrices.get(this.selectedResource) || 0;
        
        const subtotal = price * amount;
        const tax = subtotal * this.economySystem.taxRate;
        const total = this.tradeMode === 'buy' ? subtotal + tax : subtotal - tax;
        
        document.getElementById('trade-subtotal').textContent = `${subtotal}G`;
        document.getElementById('trade-tax').textContent = `${Math.round(tax)}G`;
        document.getElementById('trade-total').textContent = `${Math.round(total)}G`;
    }
    
    confirmTrade() {
        const amount = parseInt(document.getElementById('trade-amount').value);
        let result;
        
        if (this.selectedMerchant) {
            // 商人との取引
            if (this.tradeMode === 'buy') {
                result = this.economySystem.buyFromMerchant(
                    this.selectedMerchant.id,
                    this.selectedResource,
                    amount
                );
            } else {
                result = this.economySystem.sellToMerchant(
                    this.selectedMerchant.id,
                    this.selectedResource,
                    amount
                );
            }
        } else {
            // 通常の市場取引
            if (this.tradeMode === 'buy') {
                result = this.economySystem.buyResource(this.selectedResource, amount);
            } else {
                result = this.economySystem.sellResource(this.selectedResource, amount);
            }
        }
        
        if (result.success) {
            const message = this.tradeMode === 'buy' ? 
                `${this.getResourceName(this.selectedResource)}を${amount}個購入しました` :
                `${this.getResourceName(this.selectedResource)}を${amount}個売却しました`;
            this.uiManager.showNotification(message, 'success');
            this.closeTradeDialog();
            this.refresh();
            
            // リソース表示を更新
            this.uiManager.updateResourceDisplay(this.uiManager.game.resourceManager.resources);
        } else {
            this.uiManager.showNotification(result.reason || '取引に失敗しました', 'error');
        }
    }
    
    showMerchantDetails(merchant) {
        // 商人専用の取引画面を表示（簡略化のため、通常の取引ダイアログを使用）
        // 実際のゲームでは、商人専用のUIを作成することを推奨
    }
    
    getResourceIcon(resource) {
        const icons = {
            food: '🍖',
            wood: '🪵',
            stone: '🪨',
            iron: '⚙️',
            money: '💰',
            wheat: '🌾',
            corn: '🌽',
            flour: '🌾',
            bread: '🍞',
            tools: '🔨',
            wheat_seed: '🌱',
            corn_seed: '🌱',
            stone_blocks: '🧱',
            rare_seeds: '✨'
        };
        return icons[resource] || '📦';
    }
    
    getResourceName(resource) {
        const names = {
            food: '食料',
            wood: '木材',
            stone: '石材',
            iron: '鉄',
            money: 'お金',
            wheat: '小麦',
            corn: 'とうもろこし',
            flour: '小麦粉',
            bread: 'パン',
            tools: '道具',
            wheat_seed: '小麦の種',
            corn_seed: 'とうもろこしの種',
            stone_blocks: '石ブロック',
            rare_seeds: 'レアな種'
        };
        return names[resource] || resource;
    }
    
    getSpecializationName(specialization) {
        const names = {
            food: '食料商',
            materials: '資材商',
            tools: '道具商',
            seeds: '種子商',
            luxury: '高級品商'
        };
        return names[specialization] || '商人';
    }
    
    getPriceTrend(resource) {
        const history = this.economySystem.priceHistory.get(resource);
        if (!history || history.length < 2) {
            return { text: '→ 安定', class: 'trend-stable' };
        }
        
        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        const change = ((current - previous) / previous) * 100;
        
        if (change > 5) {
            return { text: `↑ ${change.toFixed(0)}%`, class: 'trend-up' };
        } else if (change < -5) {
            return { text: `↓ ${change.toFixed(0)}%`, class: 'trend-down' };
        } else {
            return { text: '→ 安定', class: 'trend-stable' };
        }
    }
}