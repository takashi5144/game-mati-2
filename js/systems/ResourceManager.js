// 資源管理システム
export class ResourceManager {
    constructor(initialResources) {
        this.resources = JSON.parse(JSON.stringify(initialResources)); // ディープコピー
        this.listeners = new Map();
    }

    // リソースの更新
    update(deltaTime, population) {
        // 食料消費
        if (population > 0) {
            const consumption = population * 0.1 * deltaTime;
            this.consume({ food: consumption });
        }

        // リソース上限のチェック
        for (const [key, resource] of Object.entries(this.resources)) {
            if (resource.max && resource.current > resource.max) {
                resource.current = resource.max;
            }
            if (resource.current < 0) {
                resource.current = 0;
            }
        }

        this.notifyListeners('resourcesChanged', this.resources);
    }

    // リソースの追加
    add(amounts) {
        for (const [key, amount] of Object.entries(amounts)) {
            // 動的にリソースを追加
            if (!this.resources[key]) {
                this.resources[key] = { current: 0, max: 1000 };
            }
            this.resources[key].current += amount;
        }
        this.notifyListeners('resourcesAdded', amounts);
    }

    // リソースの消費
    consume(amounts) {
        for (const [key, amount] of Object.entries(amounts)) {
            if (this.resources[key]) {
                this.resources[key].current -= amount;
            }
        }
        this.notifyListeners('resourcesConsumed', amounts);
    }

    // リソースが足りるかチェック
    canAfford(costs) {
        for (const [key, amount] of Object.entries(costs)) {
            if (!this.resources[key] || this.resources[key].current < amount) {
                return false;
            }
        }
        return true;
    }
    
    // リソースがあるかチェック
    has(resource, amount) {
        // 動的にリソースを追加
        if (!this.resources[resource]) {
            this.resources[resource] = { current: 0, max: 1000 };
        }
        return this.resources[resource].current >= amount;
    }

    // 特定のリソースを取得
    getResource(type) {
        return this.resources[type] ? this.resources[type].current : 0;
    }

    // すべてのリソースを取得
    getAllResources() {
        const result = {};
        for (const [key, resource] of Object.entries(this.resources)) {
            result[key] = resource.current;
        }
        return result;
    }

    // ストレージ容量の更新
    updateStorageCapacity(type, additionalCapacity) {
        if (this.resources[type] && this.resources[type].max) {
            this.resources[type].max += additionalCapacity;
        }
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
}