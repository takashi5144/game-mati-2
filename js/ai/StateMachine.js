// AIステートマシン
export class StateMachine {
    constructor(states, initialState) {
        this.states = states;
        this.currentState = initialState;
        this.previousState = null;
        this.stateData = {};
    }
    
    update(entity, deltaTime) {
        const state = this.states[this.currentState];
        if (!state) return;
        
        // 現在の状態を更新
        if (state.update) {
            state.update(entity, deltaTime, this.stateData);
        }
        
        // 遷移をチェック
        if (state.transitions) {
            for (const transition of state.transitions) {
                if (transition.condition(entity, this.stateData)) {
                    this.transitionTo(transition.to, entity);
                    break;
                }
            }
        }
    }
    
    transitionTo(newState, entity) {
        if (!this.states[newState]) {
            console.error(`State ${newState} does not exist`);
            return;
        }
        
        const oldState = this.states[this.currentState];
        const nextState = this.states[newState];
        
        // 現在の状態を終了
        if (oldState && oldState.exit) {
            oldState.exit(entity, this.stateData);
        }
        
        // 状態を変更
        this.previousState = this.currentState;
        this.currentState = newState;
        
        // 新しい状態を開始
        if (nextState.enter) {
            nextState.enter(entity, this.stateData);
        }
        
        console.log(`${entity.name} transitioned from ${this.previousState} to ${this.currentState}`);
    }
    
    getCurrentState() {
        return this.currentState;
    }
    
    getPreviousState() {
        return this.previousState;
    }
    
    setStateData(key, value) {
        this.stateData[key] = value;
    }
    
    getStateData(key) {
        return this.stateData[key];
    }
    
    clearStateData() {
        this.stateData = {};
    }
}

// 住民用AIステート定義
export const ResidentStates = {
    // アイドル状態
    IDLE: {
        enter: (resident, data) => {
            data.idleTimer = 0;
            data.nextDecisionTime = 2 + Math.random() * 3;
        },
        update: (resident, deltaTime, data) => {
            data.idleTimer += deltaTime;
            
            // アイドルアニメーション
            const wobble = Math.sin(data.idleTimer * 2) * 0.02;
            if (resident.mesh) {
                resident.mesh.position.y = wobble;
            }
        },
        transitions: [
            {
                to: 'FIND_WORK',
                condition: (resident, data) => {
                    return resident.profession.id !== 'none' && 
                           data.idleTimer > data.nextDecisionTime &&
                           !resident.workplace;
                }
            },
            {
                to: 'GO_TO_WORK',
                condition: (resident) => {
                    return resident.workplace && resident.workTime;
                }
            },
            {
                to: 'FIND_FOOD',
                condition: (resident) => {
                    return resident.needs.hunger < 30;
                }
            },
            {
                to: 'GO_HOME',
                condition: (resident) => {
                    return resident.needs.energy < 30 && resident.home;
                }
            },
            {
                to: 'WANDER',
                condition: (resident, data) => {
                    return data.idleTimer > data.nextDecisionTime;
                }
            }
        ]
    },
    
    // 仕事を探す
    FIND_WORK: {
        enter: (resident, data) => {
            data.searchTimer = 0;
            data.searchTimeout = 10;
        },
        update: (resident, deltaTime, data) => {
            data.searchTimer += deltaTime;
            
            // タイムアウトチェック
            if (data.searchTimer > data.searchTimeout) {
                data.failedToFindWork = true;
            }
        },
        transitions: [
            {
                to: 'GO_TO_WORK',
                condition: (resident) => resident.workplace !== null
            },
            {
                to: 'IDLE',
                condition: (resident, data) => data.failedToFindWork
            }
        ]
    },
    
    // 職場に向かう
    GO_TO_WORK: {
        enter: (resident, data) => {
            if (resident.workplace) {
                data.destination = {
                    x: resident.workplace.x,
                    z: resident.workplace.z
                };
                data.path = resident.calculatePath(resident.position, data.destination);
                data.pathIndex = 0;
            }
        },
        update: (resident, deltaTime, data) => {
            if (!data.path || data.path.length === 0) return;
            
            const speed = resident.profession.moveSpeed || 0.05;
            const target = data.path[data.pathIndex];
            
            if (target) {
                const dx = target.x - resident.position.x;
                const dz = target.z - resident.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 0.1) {
                    data.pathIndex++;
                    if (data.pathIndex >= data.path.length) {
                        data.arrivedAtWork = true;
                    }
                } else {
                    // 移動
                    const moveX = (dx / distance) * speed;
                    const moveZ = (dz / distance) * speed;
                    
                    resident.position.x += moveX;
                    resident.position.z += moveZ;
                    
                    // メッシュの更新
                    if (resident.mesh) {
                        resident.mesh.position.x = resident.position.x;
                        resident.mesh.position.z = resident.position.z;
                        
                        // 進行方向を向く
                        const angle = Math.atan2(dx, dz);
                        resident.mesh.rotation.y = angle;
                    }
                }
            }
        },
        transitions: [
            {
                to: 'WORKING',
                condition: (resident, data) => data.arrivedAtWork
            },
            {
                to: 'IDLE',
                condition: (resident) => !resident.workplace
            }
        ]
    },
    
    // 作業中
    WORKING: {
        enter: (resident, data) => {
            data.workTimer = 0;
            data.workDuration = 30 + Math.random() * 30;
            data.productionTimer = 0;
        },
        update: (resident, deltaTime, data) => {
            data.workTimer += deltaTime;
            data.productionTimer += deltaTime;
            
            // 作業アニメーション
            if (resident.mesh) {
                if (resident.profession.id === 'farmer') {
                    // 農作業のアニメーション
                    resident.mesh.rotation.x = Math.sin(data.workTimer * 3) * 0.1;
                } else if (resident.profession.id === 'builder') {
                    // 建築作業のアニメーション
                    resident.mesh.position.y = Math.abs(Math.sin(data.workTimer * 4)) * 0.1;
                } else if (resident.profession.id === 'lumberjack') {
                    // 伐採アニメーション
                    const swing = Math.sin(data.workTimer * 2);
                    resident.mesh.rotation.z = swing * 0.3;
                }
            }
            
            // 生産処理
            if (data.productionTimer > 5) {
                data.productionTimer = 0;
                // 作業による生産や進捗を処理
                resident.performWork();
            }
            
            // エネルギー消費
            resident.needs.energy -= deltaTime * 2;
            resident.needs.hunger -= deltaTime * 1;
        },
        exit: (resident, data) => {
            // アニメーションをリセット
            if (resident.mesh) {
                resident.mesh.rotation.x = 0;
                resident.mesh.rotation.z = 0;
                resident.mesh.position.y = 0;
            }
        },
        transitions: [
            {
                to: 'FIND_FOOD',
                condition: (resident) => resident.needs.hunger < 20
            },
            {
                to: 'REST',
                condition: (resident) => resident.needs.energy < 20
            },
            {
                to: 'IDLE',
                condition: (resident, data) => data.workTimer > data.workDuration
            }
        ]
    },
    
    // 食事を探す
    FIND_FOOD: {
        enter: (resident, data) => {
            data.searchTimer = 0;
            // 最寄りの市場や納屋を探す
            data.destination = resident.findNearestFoodSource();
        },
        update: (resident, deltaTime, data) => {
            data.searchTimer += deltaTime;
            
            if (!data.destination && data.searchTimer > 5) {
                data.failedToFindFood = true;
            }
        },
        transitions: [
            {
                to: 'GO_TO_FOOD',
                condition: (resident, data) => data.destination !== null
            },
            {
                to: 'IDLE',
                condition: (resident, data) => data.failedToFindFood
            }
        ]
    },
    
    // 食事場所に向かう
    GO_TO_FOOD: {
        enter: (resident, data) => {
            if (data.destination) {
                data.path = resident.calculatePath(resident.position, data.destination);
                data.pathIndex = 0;
            }
        },
        update: (resident, deltaTime, data) => {
            // GO_TO_WORKと同様の移動処理
            if (!data.path || data.path.length === 0) return;
            
            const speed = resident.profession.moveSpeed || 0.05;
            const target = data.path[data.pathIndex];
            
            if (target) {
                const dx = target.x - resident.position.x;
                const dz = target.z - resident.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 0.1) {
                    data.pathIndex++;
                    if (data.pathIndex >= data.path.length) {
                        data.arrivedAtFood = true;
                    }
                } else {
                    // 移動
                    const moveX = (dx / distance) * speed;
                    const moveZ = (dz / distance) * speed;
                    
                    resident.position.x += moveX;
                    resident.position.z += moveZ;
                    
                    if (resident.mesh) {
                        resident.mesh.position.x = resident.position.x;
                        resident.mesh.position.z = resident.position.z;
                        
                        const angle = Math.atan2(dx, dz);
                        resident.mesh.rotation.y = angle;
                    }
                }
            }
        },
        transitions: [
            {
                to: 'EATING',
                condition: (resident, data) => data.arrivedAtFood
            }
        ]
    },
    
    // 食事中
    EATING: {
        enter: (resident, data) => {
            data.eatTimer = 0;
            data.eatDuration = 5;
        },
        update: (resident, deltaTime, data) => {
            data.eatTimer += deltaTime;
            
            // 食事で空腹を回復
            resident.needs.hunger = Math.min(100, resident.needs.hunger + deltaTime * 20);
            
            // 食事アニメーション
            if (resident.mesh) {
                resident.mesh.rotation.x = Math.sin(data.eatTimer * 8) * 0.05;
            }
        },
        exit: (resident, data) => {
            if (resident.mesh) {
                resident.mesh.rotation.x = 0;
            }
        },
        transitions: [
            {
                to: 'IDLE',
                condition: (resident, data) => {
                    return data.eatTimer > data.eatDuration || resident.needs.hunger > 80;
                }
            }
        ]
    },
    
    // 休憩
    REST: {
        enter: (resident, data) => {
            data.restTimer = 0;
            data.restDuration = 10;
        },
        update: (resident, deltaTime, data) => {
            data.restTimer += deltaTime;
            
            // エネルギーを回復
            resident.needs.energy = Math.min(100, resident.needs.energy + deltaTime * 10);
            
            // 休憩アニメーション（座る）
            if (resident.mesh) {
                resident.mesh.scale.y = 0.8;
            }
        },
        exit: (resident, data) => {
            if (resident.mesh) {
                resident.mesh.scale.y = 1;
            }
        },
        transitions: [
            {
                to: 'IDLE',
                condition: (resident, data) => {
                    return data.restTimer > data.restDuration || resident.needs.energy > 80;
                }
            }
        ]
    },
    
    // 徘徊
    WANDER: {
        enter: (resident, data) => {
            // ランダムな目的地を設定
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            data.destination = {
                x: resident.position.x + Math.cos(angle) * distance,
                z: resident.position.z + Math.sin(angle) * distance
            };
            data.path = resident.calculatePath(resident.position, data.destination);
            data.pathIndex = 0;
            data.wanderTimer = 0;
        },
        update: (resident, deltaTime, data) => {
            data.wanderTimer += deltaTime;
            
            // 移動処理
            if (data.path && data.pathIndex < data.path.length) {
                const speed = resident.profession.moveSpeed * 0.5 || 0.025;
                const target = data.path[data.pathIndex];
                
                const dx = target.x - resident.position.x;
                const dz = target.z - resident.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 0.1) {
                    data.pathIndex++;
                } else {
                    const moveX = (dx / distance) * speed;
                    const moveZ = (dz / distance) * speed;
                    
                    resident.position.x += moveX;
                    resident.position.z += moveZ;
                    
                    if (resident.mesh) {
                        resident.mesh.position.x = resident.position.x;
                        resident.mesh.position.z = resident.position.z;
                        
                        const angle = Math.atan2(dx, dz);
                        resident.mesh.rotation.y = angle;
                    }
                }
            }
        },
        transitions: [
            {
                to: 'IDLE',
                condition: (resident, data) => {
                    return data.wanderTimer > 10 || data.pathIndex >= data.path.length;
                }
            }
        ]
    },
    
    // 家に帰る
    GO_HOME: {
        enter: (resident, data) => {
            if (resident.home) {
                data.destination = {
                    x: resident.home.x,
                    z: resident.home.z
                };
                data.path = resident.calculatePath(resident.position, data.destination);
                data.pathIndex = 0;
            }
        },
        update: (resident, deltaTime, data) => {
            // 移動処理（GO_TO_WORKと同様）
            if (!data.path || data.path.length === 0) return;
            
            const speed = resident.profession.moveSpeed || 0.05;
            const target = data.path[data.pathIndex];
            
            if (target) {
                const dx = target.x - resident.position.x;
                const dz = target.z - resident.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 0.1) {
                    data.pathIndex++;
                    if (data.pathIndex >= data.path.length) {
                        data.arrivedAtHome = true;
                    }
                } else {
                    const moveX = (dx / distance) * speed;
                    const moveZ = (dz / distance) * speed;
                    
                    resident.position.x += moveX;
                    resident.position.z += moveZ;
                    
                    if (resident.mesh) {
                        resident.mesh.position.x = resident.position.x;
                        resident.mesh.position.z = resident.position.z;
                        
                        const angle = Math.atan2(dx, dz);
                        resident.mesh.rotation.y = angle;
                    }
                }
            }
        },
        transitions: [
            {
                to: 'SLEEPING',
                condition: (resident, data) => data.arrivedAtHome
            }
        ]
    },
    
    // 睡眠中
    SLEEPING: {
        enter: (resident, data) => {
            data.sleepTimer = 0;
            data.sleepDuration = 20;
            
            // 建物内に入る（非表示）
            if (resident.mesh) {
                resident.mesh.visible = false;
            }
        },
        update: (resident, deltaTime, data) => {
            data.sleepTimer += deltaTime;
            
            // エネルギーと幸福度を回復
            resident.needs.energy = Math.min(100, resident.needs.energy + deltaTime * 15);
            resident.needs.happiness = Math.min(100, resident.needs.happiness + deltaTime * 5);
        },
        exit: (resident, data) => {
            // 建物から出る（表示）
            if (resident.mesh) {
                resident.mesh.visible = true;
            }
        },
        transitions: [
            {
                to: 'IDLE',
                condition: (resident, data) => {
                    return data.sleepTimer > data.sleepDuration || resident.needs.energy > 90;
                }
            }
        ]
    }
};