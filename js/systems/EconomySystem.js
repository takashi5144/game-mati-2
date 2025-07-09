// 経済システム
export class EconomySystem {
    constructor(game) {
        this.game = game;
        
        // 市場価格
        this.basePrices = {
            food: 10,
            wood: 5,
            stone: 8,
            iron: 20,
            wheat: 12,
            corn: 15,
            flour: 18,
            bread: 25,
            tools: 50,
            wheat_seed: 5,
            corn_seed: 8,
            stone_blocks: 15
        };
        
        // 現在の市場価格（変動あり）
        this.marketPrices = new Map();
        
        // 価格履歴
        this.priceHistory = new Map();
        
        // 供給と需要
        this.supply = new Map();
        this.demand = new Map();
        
        // 交易ルート
        this.tradeRoutes = [];
        
        // 商人
        this.merchants = [];
        
        // 取引履歴
        this.transactionHistory = [];
        
        // 税率
        this.taxRate = 0.1; // 10%
        
        // 市場建物
        this.markets = [];
    }
    
    init() {
        // 初期価格の設定
        for (const [resource, basePrice] of Object.entries(this.basePrices)) {
            this.marketPrices.set(resource, basePrice);
            this.priceHistory.set(resource, [basePrice]);
            this.supply.set(resource, 0);
            this.demand.set(resource, 0);
        }
        
        console.log('✅ EconomySystem 初期化完了');
    }
    
    // 市場価格の更新
    updateMarketPrices() {
        for (const [resource, basePrice] of Object.entries(this.basePrices)) {
            const supply = this.supply.get(resource) || 0;
            const demand = this.demand.get(resource) || 0;
            
            // 供給と需要に基づく価格変動
            let priceMultiplier = 1.0;
            
            if (demand > 0) {
                const ratio = supply / demand;
                if (ratio < 0.5) {
                    // 供給不足：価格上昇
                    priceMultiplier = 1.5 - ratio;
                } else if (ratio > 2.0) {
                    // 供給過剰：価格下落
                    priceMultiplier = 0.5 + (1 / ratio);
                } else {
                    // バランスが取れている
                    priceMultiplier = 1.0;
                }
            }
            
            // ランダムな変動を追加（±10%）
            const randomFactor = 0.9 + Math.random() * 0.2;
            priceMultiplier *= randomFactor;
            
            // 価格の上限と下限
            priceMultiplier = Math.max(0.5, Math.min(2.0, priceMultiplier));
            
            const newPrice = Math.round(basePrice * priceMultiplier);
            this.marketPrices.set(resource, newPrice);
            
            // 価格履歴に追加
            const history = this.priceHistory.get(resource);
            history.push(newPrice);
            if (history.length > 100) {
                history.shift(); // 古いデータを削除
            }
        }
    }
    
    // 供給の更新
    updateSupply() {
        // 各資源の供給量をリセット
        for (const resource of this.supply.keys()) {
            this.supply.set(resource, 0);
        }
        
        // 生産建物からの供給
        if (this.game.buildingSystem) {
            this.game.buildingSystem.buildings.forEach(building => {
                if (building.isComplete && building.config.production) {
                    for (const [resource, rate] of Object.entries(building.config.production)) {
                        const currentSupply = this.supply.get(resource) || 0;
                        this.supply.set(resource, currentSupply + rate);
                    }
                }
            });
        }
        
        // 在庫からの供給
        if (this.game.resourceManager) {
            for (const [resource, data] of this.game.resourceManager.resources.entries()) {
                const currentSupply = this.supply.get(resource) || 0;
                this.supply.set(resource, currentSupply + data.current * 0.01); // 在庫の1%
            }
        }
    }
    
    // 需要の更新
    updateDemand() {
        // 各資源の需要をリセット
        for (const resource of this.demand.keys()) {
            this.demand.set(resource, 0);
        }
        
        const population = this.game.residentSystem?.getPopulation() || 0;
        
        // 基本的な需要（人口ベース）
        this.demand.set('food', population * 0.5);
        this.demand.set('wood', population * 0.1);
        this.demand.set('tools', population * 0.05);
        
        // 建物からの需要
        if (this.game.buildingSystem) {
            this.game.buildingSystem.buildings.forEach(building => {
                if (building.isComplete && building.config.consumption) {
                    for (const [resource, rate] of Object.entries(building.config.consumption)) {
                        const currentDemand = this.demand.get(resource) || 0;
                        this.demand.set(resource, currentDemand + rate);
                    }
                }
            });
        }
        
        // 季節による需要の変動
        const season = this.game.timeSystem?.currentSeason;
        if (season === 'WINTER') {
            // 冬は食料と燃料の需要が増加
            this.demand.set('food', this.demand.get('food') * 1.2);
            this.demand.set('wood', this.demand.get('wood') * 1.5);
        } else if (season === 'SUMMER') {
            // 夏は建築資材の需要が増加
            this.demand.set('stone', this.demand.get('stone') * 1.3);
        }
    }
    
    // 商品の購入
    buyResource(resource, amount) {
        const price = this.marketPrices.get(resource) || 0;
        const totalCost = price * amount;
        const tax = totalCost * this.taxRate;
        const finalCost = totalCost + tax;
        
        // お金があるかチェック
        if (!this.game.resourceManager.has('money', finalCost)) {
            return {
                success: false,
                reason: '資金不足',
                required: finalCost,
                available: this.game.resourceManager.getResource('money')
            };
        }
        
        // 取引実行
        this.game.resourceManager.consume({ money: finalCost });
        this.game.resourceManager.add({ [resource]: amount });
        
        // 取引記録
        this.recordTransaction({
            type: 'buy',
            resource: resource,
            amount: amount,
            price: price,
            tax: tax,
            total: finalCost,
            timestamp: Date.now()
        });
        
        // 需要を増やす
        this.demand.set(resource, this.demand.get(resource) + amount * 0.1);
        
        return {
            success: true,
            cost: finalCost,
            tax: tax
        };
    }
    
    // 商品の売却
    sellResource(resource, amount) {
        // 在庫があるかチェック
        if (!this.game.resourceManager.has(resource, amount)) {
            return {
                success: false,
                reason: '在庫不足',
                required: amount,
                available: this.game.resourceManager.getResource(resource)
            };
        }
        
        const price = this.marketPrices.get(resource) || 0;
        const totalRevenue = price * amount;
        const tax = totalRevenue * this.taxRate;
        const finalRevenue = totalRevenue - tax;
        
        // 取引実行
        this.game.resourceManager.consume({ [resource]: amount });
        this.game.resourceManager.add({ money: finalRevenue });
        
        // 取引記録
        this.recordTransaction({
            type: 'sell',
            resource: resource,
            amount: amount,
            price: price,
            tax: tax,
            total: finalRevenue,
            timestamp: Date.now()
        });
        
        // 供給を増やす
        this.supply.set(resource, this.supply.get(resource) + amount * 0.1);
        
        return {
            success: true,
            revenue: finalRevenue,
            tax: tax
        };
    }
    
    // 交易ルートの追加
    addTradeRoute(route) {
        this.tradeRoutes.push({
            id: `route_${this.tradeRoutes.length}`,
            from: route.from,
            to: route.to,
            goods: route.goods,
            frequency: route.frequency || 7, // デフォルト7日ごと
            lastTrade: 0,
            profitability: 0,
            active: true
        });
    }
    
    // 商人の追加
    spawnMerchant(type = 'traveling') {
        const merchant = {
            id: `merchant_${this.merchants.length}`,
            type: type,
            name: this.generateMerchantName(),
            inventory: new Map(),
            money: 1000 + Math.random() * 2000,
            specialization: this.getRandomSpecialization(),
            priceModifier: 0.9 + Math.random() * 0.2, // 90%〜110%
            reputation: 50,
            arrivalTime: this.game.timeSystem?.currentDay || 0,
            departureTime: (this.game.timeSystem?.currentDay || 0) + 2 + Math.floor(Math.random() * 3)
        };
        
        // 商品を持たせる
        this.stockMerchant(merchant);
        
        this.merchants.push(merchant);
        
        // 通知
        this.game.ui?.showNotification(`${merchant.name}が到着しました`, 'info');
        
        return merchant;
    }
    
    // 商人に商品を持たせる
    stockMerchant(merchant) {
        const goods = this.getSpecializationGoods(merchant.specialization);
        
        goods.forEach(resource => {
            const amount = 10 + Math.floor(Math.random() * 20);
            merchant.inventory.set(resource, amount);
        });
        
        // 特別な商品
        if (Math.random() < 0.3) {
            merchant.inventory.set('rare_seeds', 5);
        }
    }
    
    // 商人から購入
    buyFromMerchant(merchantId, resource, amount) {
        const merchant = this.merchants.find(m => m.id === merchantId);
        if (!merchant) return { success: false, reason: '商人が見つかりません' };
        
        const available = merchant.inventory.get(resource) || 0;
        if (available < amount) {
            return { success: false, reason: '在庫不足' };
        }
        
        const basePrice = this.marketPrices.get(resource) || 10;
        const price = Math.round(basePrice * merchant.priceModifier);
        const totalCost = price * amount;
        
        // 購入処理
        const result = this.buyResource(resource, amount);
        if (result.success) {
            merchant.inventory.set(resource, available - amount);
            merchant.money += totalCost;
            merchant.reputation += 1;
        }
        
        return result;
    }
    
    // 商人に売却
    sellToMerchant(merchantId, resource, amount) {
        const merchant = this.merchants.find(m => m.id === merchantId);
        if (!merchant) return { success: false, reason: '商人が見つかりません' };
        
        const basePrice = this.marketPrices.get(resource) || 10;
        const price = Math.round(basePrice * merchant.priceModifier * 0.8); // 買取価格は80%
        const totalRevenue = price * amount;
        
        if (merchant.money < totalRevenue) {
            return { success: false, reason: '商人の資金不足' };
        }
        
        // 売却処理
        const result = this.sellResource(resource, amount);
        if (result.success) {
            const current = merchant.inventory.get(resource) || 0;
            merchant.inventory.set(resource, current + amount);
            merchant.money -= totalRevenue;
            merchant.reputation += 1;
        }
        
        return result;
    }
    
    // 取引記録
    recordTransaction(transaction) {
        this.transactionHistory.push(transaction);
        
        // 100件を超えたら古いものを削除
        if (this.transactionHistory.length > 100) {
            this.transactionHistory.shift();
        }
    }
    
    // 経済統計の取得
    getEconomyStats() {
        const totalTransactions = this.transactionHistory.length;
        const recentTransactions = this.transactionHistory.slice(-10);
        
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        this.transactionHistory.forEach(transaction => {
            if (transaction.type === 'sell') {
                totalRevenue += transaction.total;
            } else {
                totalExpenses += transaction.total;
            }
        });
        
        const tradeBalance = totalRevenue - totalExpenses;
        
        // 価格トレンド
        const priceTrends = new Map();
        for (const [resource, history] of this.priceHistory.entries()) {
            if (history.length >= 2) {
                const current = history[history.length - 1];
                const previous = history[history.length - 2];
                const change = ((current - previous) / previous) * 100;
                priceTrends.set(resource, {
                    current: current,
                    change: change,
                    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
                });
            }
        }
        
        return {
            totalTransactions,
            recentTransactions,
            totalRevenue,
            totalExpenses,
            tradeBalance,
            priceTrends,
            activeMerchants: this.merchants.filter(m => 
                m.departureTime > (this.game.timeSystem?.currentDay || 0)
            ).length
        };
    }
    
    // 商人の名前生成
    generateMerchantName() {
        const firstNames = ['太郎', '次郎', '三郎', '花子', '梅子', '竹子'];
        const lastNames = ['商い', '交易', '旅', '道', '市', '店'];
        const titles = ['の', '屋', '商会', '組', '堂'];
        
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        const title = titles[Math.floor(Math.random() * titles.length)];
        
        return `${first}${last}${title}`;
    }
    
    // 専門分野の取得
    getRandomSpecialization() {
        const specializations = ['food', 'materials', 'tools', 'seeds', 'luxury'];
        return specializations[Math.floor(Math.random() * specializations.length)];
    }
    
    // 専門分野の商品取得
    getSpecializationGoods(specialization) {
        const goods = {
            food: ['food', 'wheat', 'corn', 'bread'],
            materials: ['wood', 'stone', 'iron', 'stone_blocks'],
            tools: ['tools', 'iron'],
            seeds: ['wheat_seed', 'corn_seed'],
            luxury: ['money', 'bread']
        };
        
        return goods[specialization] || ['food'];
    }
    
    // 市場の追加
    registerMarket(building) {
        this.markets.push(building);
        
        // 市場効果の適用
        const radius = building.config.effects?.distributionRadius || 20;
        const efficiency = building.config.effects?.tradeEfficiency || 1.2;
        
        // 価格安定化効果
        this.taxRate *= 0.9; // 税率を10%削減
    }
    
    // 更新処理
    update(deltaTime) {
        // 供給と需要の更新
        this.updateSupply();
        this.updateDemand();
        
        // 市場価格の更新（10秒ごと）
        if (Math.random() < deltaTime / 10) {
            this.updateMarketPrices();
        }
        
        // 交易ルートの処理
        this.processTradeRoutes();
        
        // 商人の処理
        this.updateMerchants();
        
        // ランダムな商人の到着（1%の確率）
        if (Math.random() < 0.01 * deltaTime) {
            this.spawnMerchant();
        }
    }
    
    // 交易ルートの処理
    processTradeRoutes() {
        const currentDay = this.game.timeSystem?.currentDay || 0;
        
        this.tradeRoutes.forEach(route => {
            if (!route.active) return;
            
            if (currentDay - route.lastTrade >= route.frequency) {
                // 交易実行
                this.executeTradeRoute(route);
                route.lastTrade = currentDay;
            }
        });
    }
    
    // 交易ルートの実行
    executeTradeRoute(route) {
        let totalProfit = 0;
        
        route.goods.forEach(good => {
            const amount = good.amount || 10;
            const buyPrice = this.marketPrices.get(good.resource) || 10;
            const sellPrice = buyPrice * 1.2; // 20%の利益
            
            // 購入
            if (this.game.resourceManager.has('money', buyPrice * amount)) {
                this.buyResource(good.resource, amount);
                totalProfit -= buyPrice * amount;
                
                // 即座に売却（簡略化）
                totalProfit += sellPrice * amount;
                this.game.resourceManager.add({ money: sellPrice * amount });
            }
        });
        
        route.profitability = totalProfit;
    }
    
    // 商人の更新
    updateMerchants() {
        const currentDay = this.game.timeSystem?.currentDay || 0;
        
        // 出発する商人を削除
        this.merchants = this.merchants.filter(merchant => {
            if (currentDay >= merchant.departureTime) {
                this.game.ui?.showNotification(`${merchant.name}が出発しました`, 'info');
                return false;
            }
            return true;
        });
    }
    
    // クリーンアップ
    dispose() {
        this.marketPrices.clear();
        this.priceHistory.clear();
        this.supply.clear();
        this.demand.clear();
        this.tradeRoutes = [];
        this.merchants = [];
        this.transactionHistory = [];
    }
}