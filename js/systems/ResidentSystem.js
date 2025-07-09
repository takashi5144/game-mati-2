// 住民システム
import { StateMachine, ResidentStates } from '../ai/StateMachine.js';

export class ResidentSystem {
    constructor(scene, professions, needsConfig) {
        this.scene = scene;
        this.professions = professions;
        this.needsConfig = needsConfig;
        this.residents = new Map();
        this.residentIdCounter = 0;
        this.residentGroup = new THREE.Group();
        this.residentGroup.name = 'residents';
        this.scene.add(this.residentGroup);
        
        this.maxPopulation = 10; // 初期の人口上限
    }

    // 住民を生成
    spawnResident(x, z, professionId = 'none', name = null) {
        const residentId = `resident_${this.residentIdCounter++}`;
        const profession = this.professions[professionId.toUpperCase()];
        
        if (!profession) {
            console.error(`Unknown profession: ${professionId}`);
            return null;
        }

        // 住民データの作成
        const resident = {
            id: residentId,
            name: name || `住民${this.residentIdCounter}`,
            profession: profession,
            position: { x: x, y: 0, z: z },
            target: null,
            path: [],
            pathIndex: 0,
            state: 'idle',
            stateTimer: 0,
            needs: this.initializeNeeds(),
            workplace: null,
            home: null,
            inventory: {},
            experience: 0,
            mesh: null,
            ai: new StateMachine(ResidentStates, 'IDLE'),
            calculatePath: (start, end) => this.calculatePath(start, end),
            findNearestFoodSource: () => this.findNearestFoodSource(resident),
            performWork: () => this.performWork(resident)
        };

        // 3Dモデルの作成
        resident.mesh = this.createResidentMesh(resident);
        resident.mesh.position.set(x, 0, z);
        resident.mesh.userData.resident = resident;
        resident.mesh.userData.type = 'resident';
        this.residentGroup.add(resident.mesh);

        this.residents.set(residentId, resident);

        console.log(`Resident spawned: ${resident.name} (${profession.name})`);
        
        // 家を割り当て
        this.assignHome(resident);
        
        return resident;
    }

    // ニーズの初期化
    initializeNeeds() {
        const needs = {};
        for (const [key, config] of Object.entries(this.needsConfig)) {
            needs[key] = config.max;
        }
        return needs;
    }

    // 住民メッシュの作成
    createResidentMesh(resident) {
        const group = new THREE.Group();
        
        // 体
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: resident.profession.color || 0x4444FF,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // 頭
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 6);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFDBBD, // 肌色
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        group.add(head);

        // 職業別のアクセサリー
        this.addProfessionAccessories(group, resident.profession);

        return group;
    }

    // 職業別アクセサリーの追加
    addProfessionAccessories(group, profession) {
        switch (profession.id) {
            case 'farmer':
                // 麦わら帽子
                const hatGeometry = new THREE.ConeGeometry(0.3, 0.2, 8);
                const hatMaterial = new THREE.MeshStandardMaterial({
                    color: 0xF4A460
                });
                const hat = new THREE.Mesh(hatGeometry, hatMaterial);
                hat.position.y = 1.4;
                group.add(hat);
                break;

            case 'builder':
                // ヘルメット
                const helmetGeometry = new THREE.SphereGeometry(0.28, 8, 4);
                const helmetMaterial = new THREE.MeshStandardMaterial({
                    color: 0xFFD700
                });
                const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
                helmet.position.y = 1.35;
                helmet.scale.y = 0.7;
                group.add(helmet);
                break;

            case 'lumberjack':
                // 斧を持たせる
                const axeHandle = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
                const axeHandleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x8B4513
                });
                const handle = new THREE.Mesh(axeHandle, axeHandleMaterial);
                handle.position.set(0.4, 0.8, 0);
                handle.rotation.z = Math.PI / 6;
                group.add(handle);
                break;
        }
    }

    // 更新処理
    update(deltaTime) {
        this.residents.forEach(resident => {
            // ニーズの更新
            this.updateNeeds(resident, deltaTime);
            
            // AIの更新
            this.updateAI(resident, deltaTime);
            
            // アニメーションの更新
            this.updateAnimation(resident, deltaTime);
        });
    }

    // ニーズの更新
    updateNeeds(resident, deltaTime) {
        for (const [key, config] of Object.entries(this.needsConfig)) {
            resident.needs[key] -= config.decreaseRate * deltaTime;
            
            if (resident.needs[key] < 0) {
                resident.needs[key] = 0;
                
                // クリティカルな状態の処理
                if (resident.needs[key] < config.critical) {
                    this.handleCriticalNeed(resident, key);
                }
            }
        }
    }

    // クリティカルなニーズの処理
    handleCriticalNeed(resident, need) {
        switch (need) {
            case 'hunger':
                // 食料を探しに行く
                resident.state = 'seeking_food';
                break;
            case 'energy':
                // 休憩する
                resident.state = 'resting';
                break;
            case 'happiness':
                // 娯楽を求める
                resident.state = 'seeking_entertainment';
                break;
        }
    }

    // AI更新
    updateAI(resident, deltaTime) {
        // 新しいステートマシンを使用
        resident.ai.update(resident, deltaTime);
        resident.state = resident.ai.getCurrentState().toLowerCase();
    }


    // アニメーションの更新
    updateAnimation(resident, deltaTime) {
        // 基本的なアイドルアニメーション
        if (resident.state === 'idle') {
            resident.mesh.position.y = Math.sin(resident.stateTimer * 2) * 0.02;
        }
    }

    // 仕事を探す
    findWork(resident) {
        // 建物システムから適切な職場を探す
        if (window.game && window.game.buildingSystem) {
            const buildings = window.game.buildingSystem.getBuildingsByType(
                this.getWorkplaceType(resident.profession.id)
            );
            
            // 作業者が必要な建物を探す
            for (const building of buildings) {
                const requiredWorkers = building.config.requiredWorkers || 0;
                if (building.workers.length < requiredWorkers) {
                    this.assignToWorkplace(resident, building);
                    break;
                }
            }
        }
    }
    
    // 家を割り当て
    assignHome(resident) {
        if (window.game && window.game.buildingSystem) {
            const houses = window.game.buildingSystem.getBuildingsByType('house');
            
            // 空きがある家を探す
            for (const house of houses) {
                if (house.isComplete) {
                    const capacity = house.config.capacity || 4;
                    const currentResidents = this.getResidentsByHome(house.id).length;
                    
                    if (currentResidents < capacity) {
                        resident.home = house;
                        console.log(`${resident.name} assigned to house at (${house.x}, ${house.z})`);
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 特定の家に住む住民を取得
    getResidentsByHome(houseId) {
        return this.getAllResidents().filter(r => r.home && r.home.id === houseId);
    }

    // 職業に対応する職場タイプを取得
    getWorkplaceType(professionId) {
        const workplaceMap = {
            'farmer': 'farm',
            'builder': 'construction',
            'lumberjack': 'lumbermill',
            'blacksmith': 'blacksmith',
            'merchant': 'market'
        };
        return workplaceMap[professionId] || null;
    }

    // 職場に割り当て
    assignToWorkplace(resident, building) {
        resident.workplace = building;
        resident.target = { x: building.x, z: building.z };
        resident.path = this.calculatePath(resident.position, resident.target);
        resident.pathIndex = 0;
        resident.state = 'moving';
        
        // 建物に作業者として登録
        window.game.buildingSystem.assignWorker(building.id, resident.id);
        
        // 農場の場合は農業システムにも登録
        if (building.type === 'farm' && window.game?.farmingSystem) {
            const farm = window.game.farmingSystem.getFarmByBuilding(building.id);
            if (farm) {
                window.game.farmingSystem.assignWorker(farm.id, resident.id);
            }
        }
    }

    // パス計算（簡易版）
    calculatePath(start, end) {
        // 直線経路を返す（後でA*アルゴリズムなどに拡張可能）
        const steps = 10;
        const path = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push({
                x: start.x + (end.x - start.x) * t,
                z: start.z + (end.z - start.z) * t
            });
        }
        
        return path;
    }

    // 職業を割り当て（changeProfessionのエイリアス）
    assignProfession(resident, professionId) {
        if (typeof resident === 'string') {
            // IDが渡された場合
            return this.changeProfession(resident, professionId);
        } else if (resident && resident.id) {
            // 住民オブジェクトが渡された場合
            return this.changeProfession(resident.id, professionId);
        }
        return false;
    }
    
    // 職業を変更
    changeProfession(residentId, newProfessionId) {
        const resident = this.residents.get(residentId);
        if (!resident) return false;

        const newProfession = this.professions[newProfessionId.toUpperCase()];
        if (!newProfession) return false;

        // 現在の職場から離れる
        if (resident.workplace && window.game && window.game.buildingSystem) {
            window.game.buildingSystem.removeWorker(resident.workplace.id, resident.id);
            resident.workplace = null;
        }

        // 職業を変更
        resident.profession = newProfession;
        resident.state = 'idle';
        resident.experience = 0;

        // メッシュを更新
        this.residentGroup.remove(resident.mesh);
        resident.mesh = this.createResidentMesh(resident);
        resident.mesh.position.set(resident.position.x, 0, resident.position.z);
        resident.mesh.userData.resident = resident;
        resident.mesh.userData.type = 'resident';
        this.residentGroup.add(resident.mesh);

        console.log(`${resident.name} changed profession to ${newProfession.name}`);
        
        // イベントを発火
        window.dispatchEvent(new CustomEvent('professionAssigned', {
            detail: {
                resident: resident,
                profession: newProfessionId
            }
        }));
        
        return true;
    }

    // 住民数を取得
    getPopulation() {
        return this.residents.size;
    }

    // 最大人口を取得
    getMaxPopulation() {
        return this.maxPopulation;
    }

    // 最大人口を増やす
    increaseMaxPopulation(amount) {
        this.maxPopulation += amount;
    }

    // 住民を取得
    getResident(id) {
        return this.residents.get(id);
    }

    // すべての住民を取得
    getAllResidents() {
        return Array.from(this.residents.values());
    }
    
    // 最寄りの食料源を探す
    findNearestFoodSource(resident) {
        let nearest = null;
        let minDistance = Infinity;
        
        // 納屋を探す
        if (window.game?.buildingSystem) {
            const barns = window.game.buildingSystem.getBuildingsByType('barn');
            for (const barn of barns) {
                if (barn.isComplete) {
                    const distance = this.calculateDistance(resident.position, barn);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = { x: barn.x, z: barn.z };
                    }
                }
            }
            
            // 市場も探す
            const markets = window.game.buildingSystem.getBuildingsByType('market');
            for (const market of markets) {
                if (market.isComplete) {
                    const distance = this.calculateDistance(resident.position, market);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearest = { x: market.x, z: market.z };
                    }
                }
            }
        }
        
        return nearest;
    }
    
    // 作業を実行
    performWork(resident) {
        if (!resident.workplace) return;
        
        // 職業別の作業処理
        switch (resident.profession.id) {
            case 'farmer':
                // 農作業（FarmingSystemが処理）
                break;
            case 'builder':
                // 建築作業（BuildingSystemが処理）
                break;
            case 'lumberjack':
                // 木材収集
                if (window.game?.resourceManager) {
                    window.game.resourceManager.add({ wood: 1 });
                }
                break;
            case 'miner':
                // 採掘
                if (window.game?.resourceManager) {
                    const rand = Math.random();
                    if (rand < 0.7) {
                        window.game.resourceManager.add({ stone: 1 });
                    } else {
                        window.game.resourceManager.add({ iron: 1 });
                    }
                }
                break;
        }
        
        // 経験値を獲得
        resident.experience += 0.1;
    }
    
    // 距離を計算
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }
}