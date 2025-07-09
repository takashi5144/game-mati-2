// シーン管理クラス
export class SceneManager {
    constructor() {
        this.scene = null;
        this.sunLight = null;
        this.ambientLight = null;
        this.helpers = new Map();
        this.layers = {
            DEFAULT: 0,
            TERRAIN: 1,
            BUILDINGS: 2,
            RESIDENTS: 3,
            EFFECTS: 4,
            UI: 5
        };
    }

    init() {
        // シーンの作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // 空の色

        // ヘルパーの追加（デバッグ用）
        if (this.isDebugMode()) {
            this.addHelpers();
        }

        console.log('✅ SceneManager 初期化完了');
    }

    addObject(object, layer = this.layers.DEFAULT) {
        object.layers.set(layer);
        this.scene.add(object);
    }

    removeObject(object) {
        this.scene.remove(object);
        
        // メモリリークを防ぐためにジオメトリとマテリアルを破棄
        if (object.geometry) {
            object.geometry.dispose();
        }
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    }

    getObjectByName(name) {
        return this.scene.getObjectByName(name);
    }

    getObjectsByLayer(layer) {
        const objects = [];
        this.scene.traverse((child) => {
            if (child.layers.test(layer)) {
                objects.push(child);
            }
        });
        return objects;
    }

    // グループの作成
    createGroup(name) {
        const group = new THREE.Group();
        group.name = name;
        this.scene.add(group);
        return group;
    }

    // ライトの更新
    updateLighting(time, season) {
        if (!this.sunLight) return;

        // 太陽の位置を時間に基づいて更新
        const dayProgress = (time % 1); // 0-1の範囲
        const angle = dayProgress * Math.PI * 2 - Math.PI / 2;
        
        const radius = 100;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius + 50;
        
        this.sunLight.position.set(x, Math.max(y, 10), 50);
        
        // 時間帯による光の強度と色の調整
        let intensity = 1.0;
        let color = new THREE.Color(0xFFFFFF);
        
        if (dayProgress < 0.25 || dayProgress > 0.75) {
            // 夜
            intensity = 0.1;
            color.setHex(0x4444AA);
        } else if (dayProgress < 0.3 || dayProgress > 0.7) {
            // 夜明け/夕暮れ
            intensity = 0.5;
            color.setHex(0xFFAA77);
        }
        
        this.sunLight.intensity = intensity;
        this.sunLight.color = color;
    }

    // デバッグヘルパー
    addHelpers() {
        // グリッドヘルパー
        const gridHelper = new THREE.GridHelper(100, 100, 0x444444, 0x222222);
        this.scene.add(gridHelper);
        this.helpers.set('grid', gridHelper);

        // 軸ヘルパー
        const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper);
        this.helpers.set('axes', axesHelper);
    }

    toggleHelpers(visible) {
        this.helpers.forEach(helper => {
            helper.visible = visible;
        });
    }

    isDebugMode() {
        return localStorage.getItem('debugMode') === 'true';
    }

    // エフェクトの追加
    addEffect(effect, duration = 1000) {
        this.addObject(effect, this.layers.EFFECTS);
        
        // 一定時間後に自動削除
        setTimeout(() => {
            this.removeObject(effect);
        }, duration);
    }

    // スカイボックスの設定
    setSkybox(textures) {
        if (textures && textures.length === 6) {
            const loader = new THREE.CubeTextureLoader();
            this.scene.background = loader.load(textures);
        }
    }

    // 環境マップの設定
    setEnvironmentMap(texture) {
        this.scene.environment = texture;
    }

    dispose() {
        // シーン内のすべてのオブジェクトを破棄
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            this.removeObject(child);
        }
        
        this.helpers.clear();
    }
}