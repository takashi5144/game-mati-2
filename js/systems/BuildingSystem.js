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
            blacksmith: 0x2F4F4F  // ダークスレートグレー
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
        if (building.type === 'farm' && window.game?.farmingSystem) {
            // 農場を作成
            window.game.farmingSystem.createFarm(building);
        } else if (building.type === 'house' && window.game?.residentSystem) {
            // 人口上限を増やす
            window.game.residentSystem.increaseMaxPopulation(building.config.capacity || 4);
        }
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
}