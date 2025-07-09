// 災害イベントシステム
import { THREE } from '../three-global.js';

export class DisasterSystem {
    constructor(game) {
        this.game = game;
        this.activeDisasters = new Map();
        this.disasterHistory = [];
        this.lastDisasterTime = 0;
        this.minDisasterInterval = 300; // 最低5分間隔
        
        // 災害タイプの定義
        this.disasterTypes = {
            FIRE: {
                id: 'fire',
                name: '火災',
                icon: '🔥',
                chance: 0.02,
                duration: 60, // 60秒
                severity: { min: 0.1, max: 0.3 },
                effects: {
                    buildingDamage: true,
                    spreadable: true,
                    spreadRadius: 3,
                    spreadChance: 0.3
                },
                mitigation: ['well', 'guardhouse'],
                description: '建物に火災が発生しました！'
            },
            PLAGUE: {
                id: 'plague',
                name: '疫病',
                icon: '🦠',
                chance: 0.015,
                duration: 180, // 3分
                severity: { min: 0.2, max: 0.5 },
                effects: {
                    populationHealth: -0.5,
                    workEfficiency: -0.5,
                    spreadable: true,
                    spreadRadius: 5,
                    spreadChance: 0.2
                },
                mitigation: ['herbalist', 'chapel'],
                description: '疫病が発生しました！'
            },
            EARTHQUAKE: {
                id: 'earthquake',
                name: '地震',
                icon: '🏚️',
                chance: 0.01,
                duration: 30, // 30秒
                severity: { min: 0.2, max: 0.5 },
                effects: {
                    buildingDamage: true,
                    instantDamage: true,
                    damageAll: true
                },
                mitigation: ['mason', 'townhall'],
                description: '地震が発生しました！'
            },
            STORM: {
                id: 'storm',
                name: '嵐',
                icon: '🌪️',
                chance: 0.025,
                duration: 120, // 2分
                severity: { min: 0.1, max: 0.25 },
                effects: {
                    buildingDamage: true,
                    cropDamage: true,
                    productionPenalty: -0.3
                },
                mitigation: ['barn', 'warehouse'],
                description: '激しい嵐が発生しました！'
            },
            DROUGHT: {
                id: 'drought',
                name: '干ばつ',
                icon: '☀️',
                chance: 0.02,
                duration: 300, // 5分
                severity: { min: 0.3, max: 0.6 },
                effects: {
                    cropGrowthSpeed: -0.7,
                    waterConsumption: 2.0,
                    happinessPenalty: -0.2
                },
                mitigation: ['well', 'warehouse'],
                description: '深刻な干ばつが始まりました！'
            },
            BANDIT_RAID: {
                id: 'bandit_raid',
                name: '盗賊の襲撃',
                icon: '🗡️',
                chance: 0.02,
                duration: 90, // 1.5分
                severity: { min: 0.1, max: 0.3 },
                effects: {
                    resourceLoss: true,
                    populationPanic: true,
                    happinessPenalty: -0.3
                },
                mitigation: ['guardhouse', 'townhall'],
                description: '盗賊が街を襲撃しています！'
            }
        };
        
        // エフェクト用のパーティクルグループ
        this.effectsGroup = new THREE.Group();
        this.effectsGroup.name = 'disaster-effects';
        this.game.scene.add(this.effectsGroup);
    }
    
    init() {
        console.log('✅ DisasterSystem 初期化完了');
    }
    
    update(deltaTime) {
        const currentTime = this.game.timeSystem?.currentDay || 0;
        
        // 災害チェック（一定間隔で）
        if (currentTime - this.lastDisasterTime > this.minDisasterInterval / 60) {
            this.checkForDisasters();
            this.lastDisasterTime = currentTime;
        }
        
        // アクティブな災害の更新
        this.updateActiveDisasters(deltaTime);
    }
    
    checkForDisasters() {
        // 防衛力による災害確率の減少
        const defenseRating = this.game.defenseRating || 0;
        const disasterReduction = Math.min(0.5, defenseRating * 0.01); // 最大50%減少
        
        for (const [type, config] of Object.entries(this.disasterTypes)) {
            const adjustedChance = config.chance * (1 - disasterReduction);
            
            if (Math.random() < adjustedChance) {
                // 同じタイプの災害が既に発生していない場合のみ
                if (!this.activeDisasters.has(type)) {
                    this.triggerDisaster(type);
                }
            }
        }
    }
    
    triggerDisaster(type) {
        const config = this.disasterTypes[type];
        if (!config) return;
        
        const severity = this.calculateSeverity(config);
        
        const disaster = {
            type: type,
            config: config,
            severity: severity,
            startTime: Date.now(),
            duration: config.duration * 1000, // ミリ秒に変換
            affectedBuildings: new Set(),
            affectedResidents: new Set(),
            totalDamage: 0
        };
        
        // 初期影響を適用
        this.applyInitialEffects(disaster);
        
        this.activeDisasters.set(type, disaster);
        this.disasterHistory.push({
            type: type,
            time: this.game.timeSystem?.currentDay || 0,
            severity: severity
        });
        
        // 通知を表示
        this.game.uiManager?.showNotification(
            config.description,
            'danger',
            config.icon
        );
        
        // イベントを発火
        window.dispatchEvent(new CustomEvent('disasterStarted', {
            detail: { type: type, config: config }
        }));
        
        console.log(`災害発生: ${config.name} (深刻度: ${Math.floor(severity * 100)}%)`);
    }
    
    calculateSeverity(config) {
        // 基本深刻度
        let severity = config.severity.min + 
            Math.random() * (config.severity.max - config.severity.min);
        
        // 緩和要因による減少
        const mitigationFactor = this.calculateMitigationFactor(config.mitigation);
        severity *= (1 - mitigationFactor);
        
        return Math.max(0.1, Math.min(1, severity));
    }
    
    calculateMitigationFactor(mitigationBuildings) {
        if (!mitigationBuildings || mitigationBuildings.length === 0) return 0;
        
        let factor = 0;
        for (const buildingType of mitigationBuildings) {
            const buildings = this.game.buildingSystem?.getBuildingsByType(buildingType);
            if (buildings && buildings.length > 0) {
                // 各建物タイプごとに最大30%の緩和効果
                factor += Math.min(0.3, buildings.length * 0.1);
            }
        }
        
        return Math.min(0.6, factor); // 最大60%の緩和
    }
    
    applyInitialEffects(disaster) {
        const effects = disaster.config.effects;
        
        if (effects.instantDamage && effects.buildingDamage) {
            this.applyBuildingDamage(disaster, true);
        }
        
        if (effects.resourceLoss) {
            this.applyResourceLoss(disaster);
        }
        
        if (effects.populationPanic) {
            this.applyPopulationPanic(disaster);
        }
        
        // 視覚エフェクトを追加
        this.createDisasterEffects(disaster);
    }
    
    updateActiveDisasters(deltaTime) {
        const toRemove = [];
        
        for (const [type, disaster] of this.activeDisasters) {
            const elapsed = Date.now() - disaster.startTime;
            
            if (elapsed >= disaster.duration) {
                // 災害終了
                toRemove.push(type);
                this.endDisaster(disaster);
            } else {
                // 継続的な効果を適用
                this.applyContinuousEffects(disaster, deltaTime);
            }
        }
        
        // 終了した災害を削除
        toRemove.forEach(type => this.activeDisasters.delete(type));
    }
    
    applyContinuousEffects(disaster, deltaTime) {
        const effects = disaster.config.effects;
        
        if (effects.buildingDamage && !effects.instantDamage) {
            this.applyBuildingDamage(disaster, false, deltaTime);
        }
        
        if (effects.spreadable) {
            this.spreadDisaster(disaster);
        }
        
        if (effects.populationHealth) {
            this.applyHealthEffects(disaster, deltaTime);
        }
        
        if (effects.cropDamage) {
            this.applyCropDamage(disaster, deltaTime);
        }
        
        // エフェクトの更新
        this.updateDisasterEffects(disaster);
    }
    
    applyBuildingDamage(disaster, instant = false, deltaTime = 0) {
        const buildings = this.game.buildingSystem?.buildings;
        if (!buildings) return;
        
        const damageRate = instant ? disaster.severity : disaster.severity * deltaTime / 60;
        
        if (disaster.config.effects.damageAll) {
            // すべての建物にダメージ（地震など）
            buildings.forEach(building => {
                if (building.isComplete) {
                    const damage = damageRate * (0.5 + Math.random() * 0.5);
                    this.damageBuilding(building, damage);
                    disaster.affectedBuildings.add(building.id);
                    disaster.totalDamage += damage;
                }
            });
        } else {
            // 特定の建物にダメージ（火災など）
            if (disaster.affectedBuildings.size === 0 && instant) {
                // 最初の建物を選択
                const buildingArray = Array.from(buildings.values());
                const target = buildingArray[Math.floor(Math.random() * buildingArray.length)];
                disaster.affectedBuildings.add(target.id);
            }
            
            disaster.affectedBuildings.forEach(buildingId => {
                const building = buildings.get(buildingId);
                if (building && building.isComplete) {
                    const damage = damageRate;
                    this.damageBuilding(building, damage);
                    disaster.totalDamage += damage;
                }
            });
        }
    }
    
    damageBuilding(building, damage) {
        if (!building.health) building.health = 1.0;
        
        building.health = Math.max(0, building.health - damage);
        
        // 建物の見た目を更新
        if (building.mesh) {
            const material = building.mesh.children[0]?.material;
            if (material) {
                // ダメージに応じて暗くする
                material.color.multiplyScalar(0.95);
            }
        }
        
        // 建物が破壊された場合
        if (building.health <= 0) {
            this.destroyBuilding(building);
        }
    }
    
    destroyBuilding(building) {
        // 建物を破壊状態にする
        building.isDestroyed = true;
        building.isComplete = false;
        building.workers = [];
        
        // 視覚的に破壊を表現
        if (building.mesh) {
            building.mesh.children.forEach(child => {
                if (child.material) {
                    child.material.color.setHex(0x333333);
                    child.material.opacity = 0.5;
                    child.material.transparent = true;
                }
            });
        }
        
        console.log(`建物が破壊されました: ${building.config.name}`);
    }
    
    spreadDisaster(disaster) {
        const effects = disaster.config.effects;
        if (!effects.spreadable || Math.random() > effects.spreadChance) return;
        
        const newTargets = new Set();
        
        disaster.affectedBuildings.forEach(buildingId => {
            const building = this.game.buildingSystem?.buildings.get(buildingId);
            if (!building) return;
            
            // 近隣の建物を探す
            this.game.buildingSystem.buildings.forEach((nearbyBuilding, nearbyId) => {
                if (disaster.affectedBuildings.has(nearbyId)) return;
                
                const distance = Math.sqrt(
                    Math.pow(building.x - nearbyBuilding.x, 2) +
                    Math.pow(building.z - nearbyBuilding.z, 2)
                );
                
                if (distance <= effects.spreadRadius) {
                    newTargets.add(nearbyId);
                }
            });
        });
        
        // 新しいターゲットを追加
        newTargets.forEach(id => disaster.affectedBuildings.add(id));
    }
    
    applyResourceLoss(disaster) {
        const resources = ['food', 'wood', 'stone', 'money'];
        const lossAmount = disaster.severity * 0.2; // 最大20%の損失
        
        resources.forEach(resource => {
            const current = this.game.resourceManager?.getResource(resource) || 0;
            const loss = Math.floor(current * lossAmount);
            
            if (loss > 0) {
                this.game.resourceManager?.consume({ [resource]: loss });
                console.log(`${resource} を ${loss} 失いました`);
            }
        });
    }
    
    applyPopulationPanic(disaster) {
        // 住民のパニック状態を設定
        if (this.game.residentSystem) {
            this.game.residentSystem.residents.forEach(resident => {
                resident.isPanicked = true;
                resident.panicDuration = disaster.duration;
                
                // 仕事を中断
                if (resident.state === 'working') {
                    resident.state = 'fleeing';
                }
            });
        }
    }
    
    applyHealthEffects(disaster, deltaTime) {
        const healthPenalty = disaster.config.effects.populationHealth * deltaTime / 60;
        
        if (this.game.residentSystem) {
            this.game.residentSystem.residents.forEach(resident => {
                resident.needs.health = Math.max(0, 
                    (resident.needs.health || 100) + healthPenalty
                );
                
                disaster.affectedResidents.add(resident.id);
            });
        }
    }
    
    applyCropDamage(disaster, deltaTime) {
        const damageRate = disaster.severity * deltaTime / 60;
        
        if (this.game.farmingSystem) {
            this.game.farmingSystem.farms.forEach(farm => {
                farm.plots.forEach(plot => {
                    if (plot.crop && plot.crop.health) {
                        plot.crop.health = Math.max(0, plot.crop.health - damageRate);
                    }
                });
            });
        }
    }
    
    createDisasterEffects(disaster) {
        switch (disaster.type) {
            case 'FIRE':
                this.createFireEffects(disaster);
                break;
            case 'EARTHQUAKE':
                this.createEarthquakeEffects(disaster);
                break;
            case 'STORM':
                this.createStormEffects(disaster);
                break;
        }
    }
    
    createFireEffects(disaster) {
        disaster.affectedBuildings.forEach(buildingId => {
            const building = this.game.buildingSystem?.buildings.get(buildingId);
            if (!building) return;
            
            // 火のパーティクルシステム
            const particleGeometry = new THREE.BufferGeometry();
            const particleCount = 50;
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const sizes = new Float32Array(particleCount);
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = building.x + (Math.random() - 0.5) * 2;
                positions[i * 3 + 1] = Math.random() * 3;
                positions[i * 3 + 2] = building.z + (Math.random() - 0.5) * 2;
                
                // 火の色（赤〜オレンジ）
                colors[i * 3] = 1;
                colors[i * 3 + 1] = Math.random() * 0.5;
                colors[i * 3 + 2] = 0;
                
                sizes[i] = Math.random() * 0.5 + 0.2;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            
            const particleMaterial = new THREE.PointsMaterial({
                size: 0.3,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const particles = new THREE.Points(particleGeometry, particleMaterial);
            particles.userData.disaster = disaster;
            particles.userData.buildingId = buildingId;
            this.effectsGroup.add(particles);
        });
    }
    
    createEarthquakeEffects(disaster) {
        // カメラの揺れ
        if (this.game.camera) {
            const originalPosition = this.game.camera.position.clone();
            
            const shakeInterval = setInterval(() => {
                this.game.camera.position.x = originalPosition.x + (Math.random() - 0.5) * 0.5;
                this.game.camera.position.y = originalPosition.y + (Math.random() - 0.5) * 0.3;
                this.game.camera.position.z = originalPosition.z + (Math.random() - 0.5) * 0.5;
            }, 50);
            
            setTimeout(() => {
                clearInterval(shakeInterval);
                this.game.camera.position.copy(originalPosition);
            }, disaster.duration);
        }
    }
    
    createStormEffects(disaster) {
        // 嵐の視覚効果（暗い空、強い風のパーティクル）
        if (this.game.scene.fog) {
            const originalFogColor = this.game.scene.fog.color.clone();
            this.game.scene.fog.color.setHex(0x333333);
            
            setTimeout(() => {
                this.game.scene.fog.color.copy(originalFogColor);
            }, disaster.duration);
        }
    }
    
    updateDisasterEffects(disaster) {
        // 火災エフェクトのアニメーション
        if (disaster.type === 'FIRE') {
            this.effectsGroup.children.forEach(effect => {
                if (effect.userData.disaster === disaster) {
                    const positions = effect.geometry.attributes.position.array;
                    
                    for (let i = 0; i < positions.length; i += 3) {
                        positions[i + 1] += 0.05; // 上昇
                        if (positions[i + 1] > 5) {
                            positions[i + 1] = 0;
                        }
                    }
                    
                    effect.geometry.attributes.position.needsUpdate = true;
                }
            });
        }
    }
    
    endDisaster(disaster) {
        // エフェクトをクリーンアップ
        const toRemove = [];
        this.effectsGroup.children.forEach(effect => {
            if (effect.userData.disaster === disaster) {
                toRemove.push(effect);
            }
        });
        
        toRemove.forEach(effect => {
            this.effectsGroup.remove(effect);
            if (effect.geometry) effect.geometry.dispose();
            if (effect.material) effect.material.dispose();
        });
        
        // パニック状態を解除
        if (this.game.residentSystem) {
            this.game.residentSystem.residents.forEach(resident => {
                if (resident.isPanicked) {
                    resident.isPanicked = false;
                    resident.state = 'idle';
                }
            });
        }
        
        // 終了通知
        this.game.uiManager?.showNotification(
            `${disaster.config.name}が終息しました`,
            'info'
        );
        
        console.log(`災害終了: ${disaster.config.name} (総ダメージ: ${Math.floor(disaster.totalDamage * 100)}%)`);
    }
    
    // 手動で災害を発生させる（デバッグ用）
    triggerManualDisaster(type) {
        if (this.disasterTypes[type]) {
            this.triggerDisaster(type);
        }
    }
    
    // クリーンアップ
    dispose() {
        this.effectsGroup.clear();
        this.activeDisasters.clear();
    }
}