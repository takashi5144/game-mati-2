// イベントシステム
export class EventSystem {
    constructor(eventsConfig) {
        this.eventsConfig = eventsConfig;
        this.activeEvents = new Map();
        this.eventHistory = [];
        this.listeners = new Map();
        this.eventIdCounter = 0;
    }

    update(deltaTime) {
        // アクティブイベントの更新
        this.activeEvents.forEach((event, id) => {
            event.remainingTime -= deltaTime;
            
            if (event.remainingTime <= 0) {
                this.endEvent(id);
            }
        });
        
        // 新しいイベントのチェック
        this.checkForNewEvents();
    }

    // 新しいイベントのチェック
    checkForNewEvents() {
        for (const [eventType, config] of Object.entries(this.eventsConfig)) {
            // 頻度に基づくイベント
            if (config.frequency) {
                if (this.shouldTriggerByFrequency(eventType, config)) {
                    this.triggerEvent(eventType);
                }
            }
            
            // 確率に基づくイベント
            if (config.chance && Math.random() < config.chance * 0.0001) { // deltaTimeで調整
                if (this.checkEventConditions(config)) {
                    this.triggerEvent(eventType);
                }
            }
        }
    }

    // 頻度に基づくトリガーチェック
    shouldTriggerByFrequency(eventType, config) {
        const lastEvent = this.eventHistory
            .filter(e => e.type === eventType)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (!lastEvent) return true;
        
        const timeSinceLast = Date.now() - lastEvent.timestamp;
        const frequencyMs = this.getFrequencyInMs(config.frequency);
        
        return timeSinceLast >= frequencyMs;
    }

    // 頻度をミリ秒に変換
    getFrequencyInMs(frequency) {
        const frequencyMap = {
            'daily': 60 * 1000,      // 1分（ゲーム内の1日）
            'weekly': 7 * 60 * 1000,  // 7分（ゲーム内の1週間）
            'monthly': 30 * 60 * 1000 // 30分（ゲーム内の1ヶ月）
        };
        return frequencyMap[frequency] || 60 * 1000;
    }

    // イベント条件のチェック
    checkEventConditions(config) {
        if (config.condition) {
            // 季節条件
            if (config.condition === 'autumn' && window.game) {
                const timeSystem = window.game.timeSystem;
                return timeSystem && timeSystem.currentSeason === 'AUTUMN';
            }
            // 他の条件を追加可能
        }
        return true;
    }

    // イベントをトリガー
    triggerEvent(eventType) {
        const config = this.eventsConfig[eventType];
        if (!config) return;
        
        const eventId = `event_${this.eventIdCounter++}`;
        const event = {
            id: eventId,
            type: eventType,
            name: config.name,
            config: config,
            remainingTime: (config.duration || 1) * 60, // 分を秒に変換
            timestamp: Date.now(),
            effects: { ...config.effects }
        };
        
        this.activeEvents.set(eventId, event);
        this.eventHistory.push({
            type: eventType,
            timestamp: Date.now()
        });
        
        // エフェクトを適用
        this.applyEventEffects(event);
        
        // リスナーに通知
        this.notifyListeners('eventTriggered', event);
        
        console.log(`Event triggered: ${config.name}`);
    }

    // イベントを終了
    endEvent(eventId) {
        const event = this.activeEvents.get(eventId);
        if (!event) return;
        
        // エフェクトを解除
        this.removeEventEffects(event);
        
        this.activeEvents.delete(eventId);
        this.notifyListeners('eventEnded', event);
        
        console.log(`Event ended: ${event.name}`);
    }

    // イベントエフェクトを適用
    applyEventEffects(event) {
        const effects = event.effects;
        
        if (!window.game) return;
        
        // 作物収穫量の修正
        if (effects.cropYield) {
            // TODO: 農業システムに収穫量修正を適用
        }
        
        // 幸福度の変更
        if (effects.happiness) {
            // TODO: 住民の幸福度を変更
        }
        
        // 水消費量の変更
        if (effects.waterConsumption) {
            // TODO: 水消費量を変更
        }
        
        // 作物成長速度の変更
        if (effects.cropGrowthSpeed) {
            // TODO: 成長速度を変更
        }
        
        // 建物ダメージ
        if (effects.buildingDamage) {
            this.applyBuildingDamage(effects.buildingDamage);
        }
        
        // 交易品
        if (effects.tradeGoods) {
            this.spawnTradeGoods(effects.tradeGoods);
        }
    }

    // イベントエフェクトを解除
    removeEventEffects(event) {
        // エフェクトの解除処理
        // 多くのエフェクトは自動的に期限切れになるため、
        // 特別な解除処理が必要な場合のみ実装
    }

    // 建物ダメージを適用
    applyBuildingDamage(damagePercent) {
        if (!window.game || !window.game.buildingSystem) return;
        
        const buildings = window.game.buildingSystem.buildings;
        buildings.forEach(building => {
            if (building.isComplete && Math.random() < damagePercent) {
                // TODO: 建物にダメージを与える
                console.log(`Building damaged: ${building.config.name}`);
            }
        });
    }

    // 交易品を生成
    spawnTradeGoods(goods) {
        // TODO: 市場に特別な交易品を追加
        console.log('Trade goods available:', goods);
    }

    // アクティブイベントを取得
    getActiveEvents() {
        return Array.from(this.activeEvents.values());
    }

    // 特定のイベントがアクティブかチェック
    isEventActive(eventType) {
        return Array.from(this.activeEvents.values())
            .some(event => event.type === eventType);
    }

    // イベントの影響を受けた値を計算
    getModifiedValue(baseValue, modifierType) {
        let modifiedValue = baseValue;
        
        this.activeEvents.forEach(event => {
            if (event.effects[modifierType]) {
                modifiedValue *= event.effects[modifierType];
            }
        });
        
        return modifiedValue;
    }

    // 災害の軽減チェック
    checkMitigation(eventType, mitigationType) {
        const config = this.eventsConfig[eventType];
        if (!config || !config.mitigation) return false;
        
        return config.mitigation.includes(mitigationType);
    }

    // イベントリスナー
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // セーブデータ用
    getSaveData() {
        return {
            activeEvents: Array.from(this.activeEvents.entries()).map(([id, event]) => ({
                id: id,
                event: {
                    type: event.type,
                    remainingTime: event.remainingTime,
                    timestamp: event.timestamp,
                    effects: event.effects
                }
            })),
            eventHistory: this.eventHistory
        };
    }

    loadSaveData(data) {
        if (data.activeEvents) {
            this.activeEvents.clear();
            data.activeEvents.forEach(({ id, event }) => {
                const config = this.eventsConfig[event.type];
                if (config) {
                    this.activeEvents.set(id, {
                        id: id,
                        type: event.type,
                        name: config.name,
                        config: config,
                        remainingTime: event.remainingTime,
                        timestamp: event.timestamp,
                        effects: event.effects
                    });
                }
            });
        }
        
        if (data.eventHistory) {
            this.eventHistory = data.eventHistory;
        }
    }
}