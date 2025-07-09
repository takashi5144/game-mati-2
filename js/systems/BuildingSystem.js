// 建物システム
import { ConstructionEffects } from '../effects/ConstructionEffects.js';

export class BuildingSystem {
    constructor(scene, buildingConfigs) {
        this.scene = scene;
        this.buildingConfigs = buildingConfigs;
        this.buildings = new Map();
        this.buildingIdCounter = 0;
        this.buildingGroup = new THREE.Group();
        this.buildingGroup.name = 'buildings';
        this.scene.add(this.buildingGroup);
        
        // 建設エフェクトシステム
        this.constructionEffects = new ConstructionEffects(scene);
    }

    // 建物を配置
    placeBuilding(x, z, type, instant = false) {
        const config = this.buildingConfigs[type.toUpperCase()];
        if (!config) {
            console.error(`Unknown building type: ${type}`);
            return null;
        }

        const buildingId = `building_${this.buildingIdCounter++}`;
        
        // 建物データの作成
        const building = {
            id: buildingId,
            type: type,
            config: config,
            x: Math.floor(x),
            z: Math.floor(z),
            progress: instant ? 1.0 : 0.0,
            isComplete: instant,
            workers: [],
            production: {},
            mesh: null
        };

        // 3Dモデルの作成
        building.mesh = this.createBuildingMesh(building);
        building.mesh.position.set(building.x, 0, building.z);
        building.mesh.userData.building = building;
        building.mesh.userData.type = 'building';
        this.buildingGroup.add(building.mesh);

        this.buildings.set(buildingId, building);
        
        // 建設エフェクトを開始（即座に建設の場合は除く）
        if (!instant) {
            this.constructionEffects.startConstruction(building);
        }

        console.log(`Building placed: ${config.name} at (${building.x}, ${building.z})`);
        
        // イベントを発火
        window.dispatchEvent(new CustomEvent('buildingPlaced', {
            detail: {
                building: building,
                type: type
            }
        }));
        
        return building;
    }

    // 建物メッシュの作成
    createBuildingMesh(building) {
        const config = building.config;
        const group = new THREE.Group();

        if (building.isComplete) {
            // 完成した建物
            const geometry = new THREE.BoxGeometry(
                config.size.width,
                config.size.height || 3,
                config.size.height
            );
            const material = new THREE.MeshStandardMaterial({
                color: this.getBuildingColor(building.type),
                roughness: 0.7,
                metalness: 0.1
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = (config.size.height || 3) / 2;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);

            // 建物タイプ別の詳細
            this.addBuildingDetails(group, building);
        } else {
            // 建設中の建物（半透明の輪郭のみ）
            const height = (config.size.height || 3) * building.progress;
            const geometry = new THREE.BoxGeometry(
                config.size.width,
                height,
                config.size.height
            );
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                opacity: 0.3,
                transparent: true
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = height / 2;
            group.add(mesh);
        }

        return group;
    }

    // 建物の色を取得
    getBuildingColor(type) {
        const colors = {
            house: 0x8B4513,      // 茶色
            farm: 0x228B22,       // 緑
            barn: 0xA0522D,       // シエナ
            lumbermill: 0x654321, // ダークブラウン
            market: 0xFFD700,     // ゴールド
            blacksmith: 0x2F4F4F, // ダークスレートグレー
            bakery: 0xF4A460,     // サンディブラウン
            mill: 0xDEB887,       // バーリーウッド
            mason: 0x696969,      // ディムグレー
            well: 0x4682B4,       // スティールブルー
            school: 0xB22222,     // ファイアブリック
            chapel: 0xF5F5DC,     // ベージュ
            tavern: 0x8B4513,     // サドルブラウン
            guardhouse: 0x708090, // スレートグレー
            herbalist: 0x228B22,  // フォレストグリーン
            mine: 0x36454F,       // チャコール
            townhall: 0xDAA520,   // ゴールデンロッド
            warehouse: 0x8B7355   // バーリーウッド
        };
        return colors[type] || 0x808080;
    }

    // 建物の詳細を追加
    addBuildingDetails(group, building) {
        const type = building.type;
        const config = building.config;

        switch (type) {
            case 'house':
                // 屋根
                const roofGeometry = new THREE.ConeGeometry(
                    config.size.width * 0.7,
                    config.size.height * 0.5,
                    4
                );
                const roofMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B0000
                });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.y = config.size.height || 3;
                roof.rotation.y = Math.PI / 4;
                roof.castShadow = true;
                group.add(roof);

                // 煙突
                const chimneyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
                const chimneyMaterial = new THREE.MeshStandardMaterial({
                    color: 0x696969
                });
                const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
                chimney.position.set(0.5, config.size.height + 0.5, 0.5);
                group.add(chimney);
                break;

            case 'farm':
                // 畑の畝
                for (let i = 0; i < 3; i++) {
                    const rowGeometry = new THREE.BoxGeometry(
                        config.size.width * 0.8,
                        0.2,
                        0.3
                    );
                    const rowMaterial = new THREE.MeshStandardMaterial({
                        color: 0x654321
                    });
                    const row = new THREE.Mesh(rowGeometry, rowMaterial);
                    row.position.set(0, 0.1, (i - 1) * 0.8);
                    group.add(row);
                }
                break;

            case 'barn':
                // 大きな扉
                const doorGeometry = new THREE.BoxGeometry(
                    config.size.width * 0.6,
                    config.size.height * 0.8,
                    0.1
                );
                const doorMaterial = new THREE.MeshStandardMaterial({
                    color: 0x654321
                });
                const door = new THREE.Mesh(doorGeometry, doorMaterial);
                door.position.set(0, config.size.height * 0.4, config.size.height / 2);
                group.add(door);
                break;
                
            case 'well':
                // 井戸の円形構造
                const wellRingGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
                const wellRingMaterial = new THREE.MeshStandardMaterial({
                    color: 0x696969
                });
                const wellRing = new THREE.Mesh(wellRingGeometry, wellRingMaterial);
                wellRing.position.y = 0.25;
                group.add(wellRing);
                
                // バケツ用の支柱
                const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.5);
                const poleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x654321
                });
                const pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.set(0, 1.25, 0);
                group.add(pole);
                break;
                
            case 'school':
                // 鐘楼
                const bellTowerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
                const bellTowerMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B4513
                });
                const bellTower = new THREE.Mesh(bellTowerGeometry, bellTowerMaterial);
                bellTower.position.set(0, config.size.height + 0.5, 0);
                group.add(bellTower);
                break;
                
            case 'chapel':
                // 十字架
                const crossVertical = new THREE.BoxGeometry(0.1, 1, 0.1);
                const crossHorizontal = new THREE.BoxGeometry(0.5, 0.1, 0.1);
                const crossMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFFD700
                });
                const cross1 = new THREE.Mesh(crossVertical, crossMaterial);
                const cross2 = new THREE.Mesh(crossHorizontal, crossMaterial);
                cross1.position.set(0, config.size.height + 0.5, 0);
                cross2.position.set(0, config.size.height + 0.7, 0);
                group.add(cross1);
                group.add(cross2);
                break;
                
            case 'mill':
                // 風車の羽根
                const bladeGeometry = new THREE.BoxGeometry(3, 0.1, 0.5);
                const bladeMaterial = new THREE.MeshStandardMaterial({
                    color: 0xF5DEB3
                });
                for (let i = 0; i < 4; i++) {
                    const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
                    blade.position.set(0, config.size.height * 0.8, 0);
                    blade.rotation.z = (i * Math.PI / 2);
                    group.add(blade);
                }
                break;
                
            case 'townhall':
                // 大きな時計塔
                const clockTowerGeometry = new THREE.CylinderGeometry(0.8, 1, 2);
                const clockTowerMaterial = new THREE.MeshStandardMaterial({
                    color: 0xDAA520
                });
                const clockTower = new THREE.Mesh(clockTowerGeometry, clockTowerMaterial);
                clockTower.position.set(0, config.size.height + 1, 0);
                group.add(clockTower);
                break;
                
            case 'mine':
                // 鉱山の入口
                const entranceGeometry = new THREE.BoxGeometry(
                    config.size.width * 0.4,
                    config.size.height * 0.6,
                    0.2
                );
                const entranceMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1C1C1C
                });
                const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
                entrance.position.set(0, config.size.height * 0.3, config.size.width / 2 - 0.1);
                group.add(entrance);
                break;
        }
    }

    // 建設中の足場を追加
    addConstructionScaffolding(group, config) {
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, config.size.height || 3);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0xA0522D
        });

        // 四隅に柱
        const positions = [
            [-config.size.width/2, -config.size.height/2],
            [config.size.width/2, -config.size.height/2],
            [config.size.width/2, config.size.height/2],
            [-config.size.width/2, config.size.height/2]
        ];

        positions.forEach(([x, z]) => {
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(x, (config.size.height || 3) / 2, z);
            group.add(pole);
        });
    }

    // 建物の更新
    update(deltaTime) {
        this.buildings.forEach(building => {
            if (!building.isComplete) {
                // 建設進捗の更新
                if (building.workers.length > 0) {
                    building.progress += deltaTime / building.config.buildTime;
                    
                    if (building.progress >= 1.0) {
                        building.progress = 1.0;
                        building.isComplete = true;
                        this.completeBuilding(building);
                    } else {
                        // メッシュの更新
                        this.updateBuildingMesh(building);
                        // 建設エフェクトの更新
                        this.constructionEffects.updateConstruction(building, building.progress);
                    }
                }
            } else {
                // 生産の更新
                if (building.config.production && building.workers.length > 0) {
                    this.updateProduction(building, deltaTime);
                }
            }
        });
        
        // 建設エフェクトシステムの更新
        this.constructionEffects.update(deltaTime);
    }

    // 建物の完成処理
    completeBuilding(building) {
        console.log(`Building completed: ${building.config.name}`);
        
        // 建設エフェクトの完了処理
        this.constructionEffects.completeConstruction(building);
        
        // メッシュを再作成
        this.buildingGroup.remove(building.mesh);
        building.mesh = this.createBuildingMesh(building);
        building.mesh.position.set(building.x, 0, building.z);
        building.mesh.userData.building = building;
        building.mesh.userData.type = 'building';
        this.buildingGroup.add(building.mesh);

        // エフェクトを追加
        this.addCompletionEffect(building);
        
        // 建物タイプ別の特別な処理
        this.applyBuildingEffects(building);
    }

    // 完成エフェクト
    addCompletionEffect(building) {
        // パーティクルエフェクト
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.1);
            const material = new THREE.MeshStandardMaterial({
                color: 0xFFD700,
                emissive: 0xFFD700,
                emissiveIntensity: 0.5
            });
            const particle = new THREE.Mesh(geometry, material);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = 2;
            particle.position.set(
                building.x + Math.cos(angle) * radius,
                1,
                building.z + Math.sin(angle) * radius
            );
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        
        // アニメーション
        let time = 0;
        const animate = () => {
            time += 0.016;
            
            particles.children.forEach((particle, i) => {
                particle.position.y += 0.05;
                particle.scale.multiplyScalar(0.95);
                particle.material.opacity = 1 - time;
                particle.material.transparent = true;
            });
            
            if (time < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(particles);
            }
        };
        animate();
    }

    // メッシュの更新
    updateBuildingMesh(building) {
        // 建設中の建物の高さを更新
        const mesh = building.mesh.children[0];
        if (mesh) {
            const height = (building.config.size.height || 3) * building.progress;
            mesh.scale.y = building.progress;
            mesh.position.y = height / 2;
        }
    }

    // 生産の更新
    updateProduction(building, deltaTime) {
        const efficiency = building.workers.length / (building.config.requiredWorkers || 1);
        
        for (const [resource, rate] of Object.entries(building.config.production)) {
            if (!building.production[resource]) {
                building.production[resource] = 0;
            }
            
            building.production[resource] += rate * efficiency * deltaTime / 60; // 毎分の生産量
            
            // 1単位生産されたら資源に追加
            if (building.production[resource] >= 1) {
                const amount = Math.floor(building.production[resource]);
                building.production[resource] -= amount;
                
                // イベントを発火
                window.dispatchEvent(new CustomEvent('resourceProduced', {
                    detail: {
                        buildingId: building.id,
                        resource: resource,
                        amount: amount
                    }
                }));
            }
        }
    }

    // 配置可能かチェック
    canPlaceAt(x, z, type) {
        const config = this.buildingConfigs[type.toUpperCase()];
        if (!config) return false;

        // 他の建物との重複チェック
        const checkX = Math.floor(x);
        const checkZ = Math.floor(z);
        
        for (const building of this.buildings.values()) {
            const dx = Math.abs(building.x - checkX);
            const dz = Math.abs(building.z - checkZ);
            
            if (dx < config.size.width && dz < config.size.height) {
                return false;
            }
        }

        return true;
    }

    // 建物を取得
    getBuilding(id) {
        return this.buildings.get(id);
    }

    // タイプ別に建物を取得
    getBuildingsByType(type) {
        const result = [];
        this.buildings.forEach(building => {
            if (building.type === type) {
                result.push(building);
            }
        });
        return result;
    }

    // 作業者を割り当て
    assignWorker(buildingId, worker) {
        const building = this.buildings.get(buildingId);
        if (building && !building.workers.includes(worker)) {
            building.workers.push(worker);
        }
    }

    // 作業者を解除
    removeWorker(buildingId, worker) {
        const building = this.buildings.get(buildingId);
        if (building) {
            const index = building.workers.indexOf(worker);
            if (index > -1) {
                building.workers.splice(index, 1);
            }
        }
    }
    
    // 建物の効果を適用
    applyBuildingEffects(building) {
        const effects = building.config.effects || {};
        const game = window.game;
        
        if (!game) return;
        
        // 基本的な効果の処理
        if (building.type === 'farm' && game.farmingSystem) {
            // 農場を作成
            game.farmingSystem.createFarm(building);
        } else if (building.type === 'house' && game.residentSystem) {
            // 人口上限を増やす
            game.residentSystem.increaseMaxPopulation(building.config.capacity || 4);
        }
        
        // 特殊効果の処理
        if (effects.maxPopulation && game.residentSystem) {
            game.residentSystem.increaseMaxPopulation(effects.maxPopulation);
        }
        
        if (effects.maxPopulationBonus && game.residentSystem) {
            // 町役場の人口ボーナス
            game.residentSystem.increaseMaxPopulation(effects.maxPopulationBonus);
        }
        
        if (effects.happinessBonus) {
            // 幸福度ボーナスを記録（UIで使用）
            if (!game.happinessBonuses) game.happinessBonuses = new Map();
            game.happinessBonuses.set(building.id, effects.happinessBonus);
        }
        
        if (effects.waterSupply) {
            // 水供給量を記録（井戸）
            if (!game.waterSupply) game.waterSupply = 0;
            game.waterSupply += effects.waterSupply;
        }
        
        if (effects.educationBonus) {
            // 教育ボーナスを記録（学校）
            if (!game.educationBonus) game.educationBonus = 0;
            game.educationBonus = Math.max(game.educationBonus, effects.educationBonus);
        }
        
        if (effects.skillGrowthRate) {
            // スキル成長率を記録（学校）
            if (!game.skillGrowthRate) game.skillGrowthRate = 1.0;
            game.skillGrowthRate = Math.max(game.skillGrowthRate, effects.skillGrowthRate);
        }
        
        if (effects.moraleBonus) {
            // 士気ボーナスを記録（礼拝堂）
            if (!game.moraleBonus) game.moraleBonus = 0;
            game.moraleBonus = Math.max(game.moraleBonus, effects.moraleBonus);
        }
        
        if (effects.defense) {
            // 防衛力を記録（衛兵所）
            if (!game.defenseRating) game.defenseRating = 0;
            game.defenseRating += effects.defense;
        }
        
        if (effects.crimeReduction) {
            // 犯罪率減少を記録（衛兵所）
            if (!game.crimeReduction) game.crimeReduction = 0;
            game.crimeReduction = Math.max(game.crimeReduction, effects.crimeReduction);
        }
        
        if (effects.healthBonus) {
            // 健康ボーナスを記録（薬草医）
            if (!game.healthBonus) game.healthBonus = 0;
            game.healthBonus = Math.max(game.healthBonus, effects.healthBonus);
        }
        
        if (effects.diseaseResistance) {
            // 病気耐性を記録（薬草医）
            if (!game.diseaseResistance) game.diseaseResistance = 0;
            game.diseaseResistance = Math.max(game.diseaseResistance, effects.diseaseResistance);
        }
        
        if (effects.taxEfficiency) {
            // 税効率を記録（町役場）
            if (!game.taxEfficiency) game.taxEfficiency = 1.0;
            game.taxEfficiency = Math.max(game.taxEfficiency, effects.taxEfficiency);
        }
        
        if (effects.administrationBonus) {
            // 管理ボーナスを記録（町役場）
            if (!game.administrationBonus) game.administrationBonus = 0;
            game.administrationBonus = Math.max(game.administrationBonus, effects.administrationBonus);
        }
        
        if (effects.unlockAdvancedBuildings) {
            // 高度な建物のアンロック（町役場）
            if (!game.advancedBuildingsUnlocked) game.advancedBuildingsUnlocked = true;
        }
        
        if (effects.storageEfficiency) {
            // 貯蔵効率を記録（倉庫）
            if (!game.storageEfficiency) game.storageEfficiency = 1.0;
            game.storageEfficiency = Math.max(game.storageEfficiency, effects.storageEfficiency);
        }
        
        // 貯蔵容量の処理
        if (building.config.storage && game.resourceManager) {
            if (building.config.storage.all) {
                // すべての資源の貯蔵容量を増やす（倉庫）
                const increase = building.config.storage.all;
                const resources = ['food', 'wood', 'stone', 'iron', 'wheat', 'corn'];
                resources.forEach(resource => {
                    game.resourceManager.increaseMaxStorage(resource, increase);
                });
            } else {
                // 特定の資源の貯蔵容量を増やす
                for (const [resource, amount] of Object.entries(building.config.storage)) {
                    game.resourceManager.increaseMaxStorage(resource, amount);
                }
            }
        }
        
        console.log(`Building effects applied for ${building.type}:`, effects);
    }
}