// 資源管理システム
export class ResourceManager {
    constructor(initialResources) {
        this.resources = new Map();
        // 初期リソースをMapに変換
        for (const [key, value] of Object.entries(initialResources)) {
            this.resources.set(key, { ...value });
        }
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
        for (const [key, resource] of this.resources.entries()) {
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
            if (!this.resources.has(key)) {
                this.resources.set(key, { current: 0, max: 1000 });
            }
            const resource = this.resources.get(key);
            resource.current += amount;
        }
        this.notifyListeners('resourcesAdded', amounts);
    }

    // リソースの消費
    consume(amounts) {
        for (const [key, amount] of Object.entries(amounts)) {
            if (this.resources.has(key)) {
                const resource = this.resources.get(key);
                resource.current -= amount;
            }
        }
        this.notifyListeners('resourcesConsumed', amounts);
    }

    // リソースが足りるかチェック
    canAfford(costs) {
        for (const [key, amount] of Object.entries(costs)) {
            if (!this.resources.has(key) || this.resources.get(key).current < amount) {
                return false;
            }
        }
        return true;
    }
    
    // リソースがあるかチェック
    has(resource, amount) {
        // 動的にリソースを追加
        if (!this.resources.has(resource)) {
            this.resources.set(resource, { current: 0, max: 1000 });
        }
        return this.resources.get(resource).current >= amount;
    }

    // 特定のリソースを取得
    getResource(type) {
        return this.resources.has(type) ? this.resources.get(type).current : 0;
    }

    // すべてのリソースを取得
    getAllResources() {
        const result = {};
        for (const [key, resource] of this.resources.entries()) {
            result[key] = resource.current;
        }
        return result;
    }

    // ストレージ容量の更新
    updateStorageCapacity(type, additionalCapacity) {
        if (this.resources.has(type)) {
            const resource = this.resources.get(type);
            if (resource.max) {
                resource.max += additionalCapacity;
            }
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
    
    // リソースを設定（セーブ/ロード用）
    setResource(id, current, max) {
        if (!this.resources.has(id)) {
            this.resources.set(id, { current: 0, max: max || 999 });
        }
        const resource = this.resources.get(id);
        resource.current = current;
        if (max !== undefined) {
            resource.max = max;
        }
    }
    
    // 最大貯蔵容量を増やす
    increaseMaxStorage(resourceType, amount) {
        if (!this.resources.has(resourceType)) {
            this.resources.set(resourceType, { current: 0, max: amount });
        } else {
            const resource = this.resources.get(resourceType);
            resource.max = (resource.max || 0) + amount;
        }
        this.notifyListeners('storageIncreased', { resource: resourceType, amount: amount });
        console.log(`Storage increased for ${resourceType}: +${amount} (Total: ${this.resources.get(resourceType).max})`);
    }
}