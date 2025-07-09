// セーブ/ロードシステム
export class SaveLoadSystem {
    constructor(game) {
        this.game = game;
        this.saveVersion = '1.0.0';
        this.autoSaveInterval = 60000; // 60秒ごと
        this.autoSaveTimer = null;
        this.maxSaveSlots = 5;
        this.maxAutoSaves = 3;
    }
    
    init() {
        // オートセーブの開始
        this.startAutoSave();
        
        // ページ離脱時の自動保存
        window.addEventListener('beforeunload', (e) => {
            this.quickSave();
        });
        
        console.log('✅ SaveLoadSystem 初期化完了');
    }
    
    // ゲームデータの収集
    collectGameData() {
        const data = {
            version: this.saveVersion,
            timestamp: Date.now(),
            gameTime: this.game.timeSystem?.currentDay || 0,
            season: this.game.timeSystem?.currentSeason || 'SPRING',
            weather: this.game.weatherSystem?.currentWeather || 'sunny',
            
            // リソース
            resources: this.collectResourceData(),
            
            // 建物
            buildings: this.collectBuildingData(),
            
            // 住民
            residents: this.collectResidentData(),
            
            // 畑
            farms: this.collectFarmData(),
            
            // 生産システム
            production: this.collectProductionData(),
            
            // カメラ位置
            camera: this.collectCameraData(),
            
            // 統計
            statistics: this.game.statistics || {}
        };
        
        return data;
    }
    
    // リソースデータの収集
    collectResourceData() {
        const resources = {};
        if (this.game.resourceManager?.resources) {
            for (const [key, value] of this.game.resourceManager.resources.entries()) {
                resources[key] = {
                    current: value.current,
                    max: value.max
                };
            }
        }
        return resources;
    }
    
    // 建物データの収集
    collectBuildingData() {
        const buildings = [];
        if (this.game.buildingSystem?.buildings) {
            this.game.buildingSystem.buildings.forEach(building => {
                buildings.push({
                    id: building.id,
                    type: building.type,
                    x: building.x,
                    z: building.z,
                    progress: building.progress,
                    isComplete: building.isComplete,
                    workers: building.workers,
                    production: building.production
                });
            });
        }
        return buildings;
    }
    
    // 住民データの収集
    collectResidentData() {
        const residents = [];
        if (this.game.residentSystem?.residents) {
            this.game.residentSystem.residents.forEach(resident => {
                residents.push({
                    id: resident.id,
                    name: resident.name,
                    age: resident.age,
                    profession: resident.profession.id,
                    position: {
                        x: resident.position.x,
                        y: resident.position.y,
                        z: resident.position.z
                    },
                    needs: { ...resident.needs },
                    home: resident.home,
                    workplace: resident.workplace,
                    state: resident.state,
                    currentAction: resident.currentAction
                });
            });
        }
        return residents;
    }
    
    // 畑データの収集
    collectFarmData() {
        const farms = [];
        if (this.game.farmingSystem?.farms) {
            this.game.farmingSystem.farms.forEach(farm => {
                const plots = [];
                farm.plots.forEach((plot, index) => {
                    plots.push({
                        index: index,
                        crop: plot.crop ? {
                            type: plot.crop.type,
                            stage: plot.crop.stage,
                            progress: plot.crop.progress,
                            water: plot.crop.water,
                            health: plot.crop.health
                        } : null
                    });
                });
                
                farms.push({
                    buildingId: farm.buildingId,
                    plots: plots
                });
            });
        }
        return farms;
    }
    
    // 生産データの収集
    collectProductionData() {
        const production = {
            activeProductions: [],
            queues: {}
        };
        
        if (this.game.productionSystem) {
            // アクティブな生産
            this.game.productionSystem.activeProductions.forEach(prod => {
                production.activeProductions.push({
                    buildingId: prod.buildingId,
                    recipeId: prod.recipe.id,
                    progress: prod.progress,
                    workerId: prod.workerId
                });
            });
            
            // 生産キュー
            this.game.productionSystem.productionQueues.forEach((queue, buildingId) => {
                production.queues[buildingId] = queue.map(item => ({
                    recipeId: item.recipe.id,
                    count: item.count
                }));
            });
        }
        
        return production;
    }
    
    // カメラデータの収集
    collectCameraData() {
        const camera = this.game.camera;
        const controls = this.game.controls;
        
        if (camera && controls) {
            return {
                position: {
                    x: camera.position.x,
                    y: camera.position.y,
                    z: camera.position.z
                },
                target: {
                    x: controls.target.x,
                    y: controls.target.y,
                    z: controls.target.z
                }
            };
        }
        
        return null;
    }
    
    // セーブ実行
    save(slotName = 'quicksave') {
        try {
            const saveData = this.collectGameData();
            const saveKey = `pixelfarm3d_save_${slotName}`;
            
            // データを圧縮して保存
            const jsonString = JSON.stringify(saveData);
            localStorage.setItem(saveKey, jsonString);
            
            // セーブメタデータを更新
            this.updateSaveMetadata(slotName, saveData);
            
            console.log(`✅ ゲームセーブ完了: ${slotName}`);
            this.game.uiManager?.showNotification('セーブしました', 'success');
            
            return true;
        } catch (error) {
            console.error('セーブエラー:', error);
            this.game.uiManager?.showNotification('セーブに失敗しました', 'error');
            return false;
        }
    }
    
    // クイックセーブ
    quickSave() {
        return this.save('quicksave');
    }
    
    // オートセーブ
    autoSave() {
        // オートセーブスロットをローテーション
        const autoSaveIndex = (this.getAutoSaveIndex() + 1) % this.maxAutoSaves;
        return this.save(`autosave_${autoSaveIndex}`);
    }
    
    // 現在のオートセーブインデックスを取得
    getAutoSaveIndex() {
        const metadata = this.getSaveMetadata();
        let latestIndex = 0;
        let latestTime = 0;
        
        for (let i = 0; i < this.maxAutoSaves; i++) {
            const save = metadata[`autosave_${i}`];
            if (save && save.timestamp > latestTime) {
                latestTime = save.timestamp;
                latestIndex = i;
            }
        }
        
        return latestIndex;
    }
    
    // ロード実行
    load(slotName = 'quicksave') {
        try {
            const saveKey = `pixelfarm3d_save_${slotName}`;
            const jsonString = localStorage.getItem(saveKey);
            
            if (!jsonString) {
                throw new Error('セーブデータが見つかりません');
            }
            
            const saveData = JSON.parse(jsonString);
            
            // バージョンチェック
            if (!this.isCompatibleVersion(saveData.version)) {
                throw new Error('セーブデータのバージョンが互換性がありません');
            }
            
            // ゲームをリセット
            this.resetGame();
            
            // データを復元
            this.restoreGameData(saveData);
            
            console.log(`✅ ゲームロード完了: ${slotName}`);
            this.game.uiManager?.showNotification('ロードしました', 'success');
            
            return true;
        } catch (error) {
            console.error('ロードエラー:', error);
            this.game.uiManager?.showNotification('ロードに失敗しました', 'error');
            return false;
        }
    }
    
    // ゲームデータの復元
    restoreGameData(saveData) {
        // 時間とシーズン
        if (this.game.timeSystem) {
            this.game.timeSystem.currentDay = saveData.gameTime || 0;
            this.game.timeSystem.currentSeason = saveData.season || 'SPRING';
        }
        
        // 天候
        if (this.game.weatherSystem && saveData.weather) {
            this.game.weatherSystem.changeWeather(saveData.weather, true);
        }
        
        // リソース
        this.restoreResources(saveData.resources);
        
        // 建物
        this.restoreBuildings(saveData.buildings);
        
        // 住民
        this.restoreResidents(saveData.residents);
        
        // 畑
        this.restoreFarms(saveData.farms);
        
        // 生産
        this.restoreProduction(saveData.production);
        
        // カメラ
        this.restoreCamera(saveData.camera);
        
        // 統計
        if (saveData.statistics) {
            this.game.statistics = saveData.statistics;
        }
    }
    
    // リソースの復元
    restoreResources(resources) {
        if (!resources || !this.game.resourceManager) return;
        
        for (const [key, value] of Object.entries(resources)) {
            this.game.resourceManager.setResource(key, value.current, value.max);
        }
    }
    
    // 建物の復元
    restoreBuildings(buildings) {
        if (!buildings || !this.game.buildingSystem) return;
        
        buildings.forEach(buildingData => {
            const building = this.game.buildingSystem.placeBuilding(
                buildingData.x,
                buildingData.z,
                buildingData.type,
                true // 即座に配置
            );
            
            if (building) {
                building.progress = buildingData.progress;
                building.isComplete = buildingData.isComplete;
                building.workers = buildingData.workers || [];
                building.production = buildingData.production || {};
                
                // メッシュを更新
                if (!building.isComplete) {
                    this.game.buildingSystem.updateBuildingMesh(building);
                }
            }
        });
    }
    
    // 住民の復元
    restoreResidents(residents) {
        if (!residents || !this.game.residentSystem) return;
        
        residents.forEach(residentData => {
            const resident = this.game.residentSystem.createResident();
            
            if (resident) {
                // 基本情報
                resident.name = residentData.name;
                resident.age = residentData.age;
                resident.position.set(
                    residentData.position.x,
                    residentData.position.y,
                    residentData.position.z
                );
                
                // 職業
                this.game.residentSystem.assignProfession(resident, residentData.profession);
                
                // ニーズ
                Object.assign(resident.needs, residentData.needs);
                
                // 家と職場
                resident.home = residentData.home;
                resident.workplace = residentData.workplace;
                
                // 状態
                resident.state = residentData.state;
                resident.currentAction = residentData.currentAction;
                
                // メッシュ位置を更新
                if (resident.mesh) {
                    resident.mesh.position.copy(resident.position);
                }
            }
        });
    }
    
    // 畑の復元
    restoreFarms(farms) {
        if (!farms || !this.game.farmingSystem) return;
        
        farms.forEach(farmData => {
            const building = this.game.buildingSystem.getBuilding(farmData.buildingId);
            if (building) {
                const farm = this.game.farmingSystem.createFarm(building);
                
                if (farm) {
                    farmData.plots.forEach((plotData, index) => {
                        if (plotData.crop && farm.plots[index]) {
                            const plot = farm.plots[index];
                            plot.crop = {
                                type: plotData.crop.type,
                                stage: plotData.crop.stage,
                                progress: plotData.crop.progress,
                                water: plotData.crop.water,
                                health: plotData.crop.health
                            };
                            
                            // ビジュアルを更新
                            this.game.farmingSystem.updateCropVisual(plot);
                        }
                    });
                }
            }
        });
    }
    
    // 生産の復元
    restoreProduction(production) {
        if (!production || !this.game.productionSystem) return;
        
        // アクティブな生産
        if (production.activeProductions) {
            production.activeProductions.forEach(prodData => {
                const recipe = this.game.productionSystem.recipes.get(prodData.recipeId);
                if (recipe) {
                    const prod = {
                        buildingId: prodData.buildingId,
                        recipe: recipe,
                        progress: prodData.progress,
                        workerId: prodData.workerId
                    };
                    this.game.productionSystem.activeProductions.push(prod);
                }
            });
        }
        
        // 生産キュー
        if (production.queues) {
            for (const [buildingId, queue] of Object.entries(production.queues)) {
                const queueItems = [];
                queue.forEach(item => {
                    const recipe = this.game.productionSystem.recipes.get(item.recipeId);
                    if (recipe) {
                        queueItems.push({
                            recipe: recipe,
                            count: item.count
                        });
                    }
                });
                
                if (queueItems.length > 0) {
                    this.game.productionSystem.productionQueues.set(buildingId, queueItems);
                }
            }
        }
    }
    
    // カメラの復元
    restoreCamera(cameraData) {
        if (!cameraData || !this.game.camera || !this.game.controls) return;
        
        this.game.camera.position.set(
            cameraData.position.x,
            cameraData.position.y,
            cameraData.position.z
        );
        
        this.game.controls.target.set(
            cameraData.target.x,
            cameraData.target.y,
            cameraData.target.z
        );
        
        this.game.controls.update();
    }
    
    // ゲームのリセット
    resetGame() {
        // 建物をクリア
        if (this.game.buildingSystem) {
            this.game.buildingSystem.buildings.clear();
            this.game.buildingSystem.buildingGroup.clear();
        }
        
        // 住民をクリア
        if (this.game.residentSystem) {
            this.game.residentSystem.residents.forEach(resident => {
                if (resident.mesh) {
                    this.game.residentSystem.residentGroup.remove(resident.mesh);
                }
            });
            this.game.residentSystem.residents.clear();
            this.game.residentSystem.currentPopulation = 0;
        }
        
        // 畑をクリア
        if (this.game.farmingSystem) {
            this.game.farmingSystem.farms.clear();
            this.game.farmingSystem.cropGroup.clear();
        }
        
        // 生産をクリア
        if (this.game.productionSystem) {
            this.game.productionSystem.activeProductions = [];
            this.game.productionSystem.productionQueues.clear();
        }
    }
    
    // セーブメタデータの更新
    updateSaveMetadata(slotName, saveData) {
        const metadataKey = 'pixelfarm3d_save_metadata';
        let metadata = {};
        
        try {
            const existing = localStorage.getItem(metadataKey);
            if (existing) {
                metadata = JSON.parse(existing);
            }
        } catch (e) {
            // 無視
        }
        
        metadata[slotName] = {
            timestamp: saveData.timestamp,
            gameTime: saveData.gameTime,
            season: saveData.season,
            residents: saveData.residents.length,
            buildings: saveData.buildings.length
        };
        
        localStorage.setItem(metadataKey, JSON.stringify(metadata));
    }
    
    // セーブメタデータの取得
    getSaveMetadata() {
        const metadataKey = 'pixelfarm3d_save_metadata';
        try {
            const data = localStorage.getItem(metadataKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    }
    
    // セーブスロットの一覧を取得
    getSaveSlots() {
        const metadata = this.getSaveMetadata();
        const slots = [];
        
        // 通常のセーブスロット
        for (let i = 1; i <= this.maxSaveSlots; i++) {
            const slotName = `slot_${i}`;
            const data = metadata[slotName];
            slots.push({
                name: slotName,
                displayName: `スロット ${i}`,
                data: data || null
            });
        }
        
        // クイックセーブ
        const quicksave = metadata.quicksave;
        if (quicksave) {
            slots.unshift({
                name: 'quicksave',
                displayName: 'クイックセーブ',
                data: quicksave
            });
        }
        
        // オートセーブ
        for (let i = 0; i < this.maxAutoSaves; i++) {
            const slotName = `autosave_${i}`;
            const data = metadata[slotName];
            if (data) {
                slots.push({
                    name: slotName,
                    displayName: `オートセーブ ${i + 1}`,
                    data: data
                });
            }
        }
        
        return slots;
    }
    
    // バージョン互換性チェック
    isCompatibleVersion(version) {
        // 簡単なバージョンチェック
        const [major] = version.split('.');
        const [currentMajor] = this.saveVersion.split('.');
        return major === currentMajor;
    }
    
    // オートセーブの開始
    startAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.autoSave();
        }, this.autoSaveInterval);
    }
    
    // オートセーブの停止
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }
    
    // クリーンアップ
    dispose() {
        this.stopAutoSave();
    }
}