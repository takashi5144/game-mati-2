// 農業システム
export class FarmingSystem {
    constructor(scene, cropsConfig, seasonsConfig) {
        this.scene = scene;
        this.cropsConfig = cropsConfig;
        this.seasonsConfig = seasonsConfig;
        this.farms = new Map();
        this.farmIdCounter = 0;
        this.farmGroup = new THREE.Group();
        this.farmGroup.name = 'farms';
        this.scene.add(this.farmGroup);
        
        // 作物の成長ステージ
        this.growthStages = {
            EMPTY: 'empty',
            PLANTED: 'planted',
            SPROUT: 'sprout',
            GROWING: 'growing',
            MATURE: 'mature',
            HARVEST: 'harvest',
            WITHERED: 'withered'
        };
    }
    
    // 農地を作成
    createFarm(farmBuilding) {
        const farmId = `farm_${this.farmIdCounter++}`;
        const farm = {
            id: farmId,
            building: farmBuilding,
            plots: this.createPlots(farmBuilding),
            workers: [],
            productivity: 1.0
        };
        
        this.farms.set(farmId, farm);
        farmBuilding.farmId = farmId;
        
        // 農地の視覚表現を作成
        this.createFarmVisuals(farm);
        
        return farm;
    }
    
    // 農地プロットを作成
    createPlots(building) {
        const plots = [];
        const plotsPerSide = 3; // 3x3グリッド
        const plotSize = 0.8;
        const spacing = 1.0;
        
        for (let x = 0; x < plotsPerSide; x++) {
            for (let z = 0; z < plotsPerSide; z++) {
                const plot = {
                    x: building.x + (x - 1) * spacing,
                    z: building.z + (z - 1) * spacing,
                    crop: null,
                    state: this.growthStages.EMPTY,
                    growth: 0,
                    water: 100,
                    fertility: 100,
                    mesh: null
                };
                plots.push(plot);
            }
        }
        
        return plots;
    }
    
    // 農地の視覚表現を作成
    createFarmVisuals(farm) {
        const farmGroup = new THREE.Group();
        farmGroup.position.set(farm.building.x, 0, farm.building.z);
        
        farm.plots.forEach(plot => {
            // 土のベース
            const soilGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
            const soilMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a3c28,
                roughness: 0.9
            });
            const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial);
            soilMesh.position.set(
                plot.x - farm.building.x,
                0.05,
                plot.z - farm.building.z
            );
            soilMesh.receiveShadow = true;
            farmGroup.add(soilMesh);
            
            plot.mesh = soilMesh;
        });
        
        this.farmGroup.add(farmGroup);
        farm.visualGroup = farmGroup;
    }
    
    // 作物を植える
    plantCrop(farmId, plotIndex, cropType) {
        const farm = this.farms.get(farmId);
        if (!farm) return false;
        
        const plot = farm.plots[plotIndex];
        if (!plot || plot.crop) return false;
        
        const cropConfig = this.cropsConfig[cropType.toUpperCase()];
        if (!cropConfig) return false;
        
        // 季節チェック
        const currentSeason = window.game?.timeSystem?.currentSeason || 'SPRING';
        if (!this.canPlantInSeason(cropConfig, currentSeason)) {
            return false;
        }
        
        plot.crop = {
            type: cropType,
            config: cropConfig,
            plantedDay: window.game?.timeSystem?.currentDay || 0,
            lastWatered: window.game?.timeSystem?.currentDay || 0
        };
        plot.state = this.growthStages.PLANTED;
        plot.growth = 0;
        
        // 種の視覚表現を追加
        this.updatePlotVisual(farm, plot, plotIndex);
        
        return true;
    }
    
    // 季節に植えられるかチェック
    canPlantInSeason(cropConfig, season) {
        return cropConfig.seasons.includes(season.toLowerCase());
    }
    
    // プロットの視覚表現を更新
    updatePlotVisual(farm, plot, plotIndex) {
        // 既存の作物メッシュを削除
        if (plot.cropMesh) {
            farm.visualGroup.remove(plot.cropMesh);
            plot.cropMesh.geometry.dispose();
            plot.cropMesh.material.dispose();
            plot.cropMesh = null;
        }
        
        if (plot.crop && plot.state !== this.growthStages.EMPTY) {
            const cropMesh = this.createCropMesh(plot);
            if (cropMesh) {
                cropMesh.position.set(
                    plot.x - farm.building.x,
                    0.1,
                    plot.z - farm.building.z
                );
                farm.visualGroup.add(cropMesh);
                plot.cropMesh = cropMesh;
            }
        }
        
        // 土の色を更新（水分レベルに応じて）
        if (plot.mesh) {
            const wetness = plot.water / 100;
            const dryColor = new THREE.Color(0x4a3c28);
            const wetColor = new THREE.Color(0x2d1f14);
            plot.mesh.material.color.lerpColors(dryColor, wetColor, wetness);
        }
    }
    
    // 作物メッシュを作成
    createCropMesh(plot) {
        const config = plot.crop.config;
        let geometry, material, mesh;
        
        switch (plot.state) {
            case this.growthStages.PLANTED:
                // 種
                geometry = new THREE.SphereGeometry(0.05, 8, 6);
                material = new THREE.MeshStandardMaterial({
                    color: 0x8B7355
                });
                mesh = new THREE.Mesh(geometry, material);
                break;
                
            case this.growthStages.SPROUT:
                // 芽
                geometry = new THREE.ConeGeometry(0.05, 0.1, 4);
                material = new THREE.MeshStandardMaterial({
                    color: 0x90EE90
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.05;
                break;
                
            case this.growthStages.GROWING:
                // 成長中
                const height = 0.2 + (plot.growth / 50) * 0.3;
                geometry = new THREE.CylinderGeometry(0.1, 0.15, height, 8);
                material = new THREE.MeshStandardMaterial({
                    color: config.color || 0x228B22
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = height / 2;
                break;
                
            case this.growthStages.MATURE:
            case this.growthStages.HARVEST:
                // 成熟
                mesh = this.createMatureCropMesh(config);
                break;
                
            case this.growthStages.WITHERED:
                // 枯れた
                geometry = new THREE.CylinderGeometry(0.05, 0.1, 0.3, 6);
                material = new THREE.MeshStandardMaterial({
                    color: 0x8B4513,
                    roughness: 0.9
                });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.15;
                break;
        }
        
        if (mesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
        }
        
        return mesh;
    }
    
    // 成熟した作物メッシュを作成
    createMatureCropMesh(config) {
        const group = new THREE.Group();
        
        // 茎
        const stemGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 8);
        const stemMaterial = new THREE.MeshStandardMaterial({
            color: 0x228B22
        });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        group.add(stem);
        
        // 実
        if (config.name === '小麦') {
            // 小麦の穂
            const wheatGeometry = new THREE.ConeGeometry(0.15, 0.3, 6);
            const wheatMaterial = new THREE.MeshStandardMaterial({
                color: 0xF4A460
            });
            const wheat = new THREE.Mesh(wheatGeometry, wheatMaterial);
            wheat.position.y = 0.65;
            group.add(wheat);
        } else if (config.name === 'トウモロコシ') {
            // とうもろこし
            const cornGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.25, 8);
            const cornMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFD700
            });
            const corn = new THREE.Mesh(cornGeometry, cornMaterial);
            corn.position.y = 0.5;
            group.add(corn);
        } else {
            // 汎用の実
            const fruitGeometry = new THREE.SphereGeometry(0.15, 8, 6);
            const fruitMaterial = new THREE.MeshStandardMaterial({
                color: config.color || 0xFF6347
            });
            const fruit = new THREE.Mesh(fruitGeometry, fruitMaterial);
            fruit.position.y = 0.6;
            group.add(fruit);
        }
        
        return group;
    }
    
    // 作物を収穫
    harvestCrop(farmId, plotIndex) {
        const farm = this.farms.get(farmId);
        if (!farm) return null;
        
        const plot = farm.plots[plotIndex];
        if (!plot || !plot.crop || plot.state !== this.growthStages.HARVEST) {
            return null;
        }
        
        const config = plot.crop.config;
        const yield = this.calculateYield(plot, farm);
        
        // プロットをリセット
        plot.crop = null;
        plot.state = this.growthStages.EMPTY;
        plot.growth = 0;
        plot.fertility = Math.max(0, plot.fertility - 20); // 肥沃度を減少
        
        // 視覚表現を更新
        this.updatePlotVisual(farm, plot, plotIndex);
        
        return {
            type: config.harvestResource,
            amount: yield
        };
    }
    
    // 収穫量を計算
    calculateYield(plot, farm) {
        const baseYield = plot.crop.config.baseYield || 10;
        let multiplier = 1.0;
        
        // 水分による修正
        multiplier *= (plot.water / 100) * 0.5 + 0.5;
        
        // 肥沃度による修正
        multiplier *= (plot.fertility / 100) * 0.5 + 0.5;
        
        // 農場の生産性
        multiplier *= farm.productivity;
        
        // イベントによる修正
        if (window.game?.eventSystem) {
            multiplier *= window.game.eventSystem.getModifiedValue(1.0, 'cropYield');
        }
        
        return Math.floor(baseYield * multiplier);
    }
    
    // 更新処理
    update(deltaTime) {
        const currentDay = window.game?.timeSystem?.currentDay || 0;
        const currentSeason = window.game?.timeSystem?.currentSeason || 'SPRING';
        const growthModifier = this.seasonsConfig[currentSeason]?.cropGrowthModifier || 1.0;
        
        this.farms.forEach(farm => {
            farm.plots.forEach((plot, index) => {
                if (plot.crop && plot.state !== this.growthStages.EMPTY) {
                    // 成長処理
                    this.updateCropGrowth(plot, deltaTime, growthModifier);
                    
                    // 水分を減少
                    plot.water = Math.max(0, plot.water - deltaTime * 2);
                    
                    // 視覚表現を更新
                    if (plot.lastVisualUpdate !== plot.state) {
                        this.updatePlotVisual(farm, plot, index);
                        plot.lastVisualUpdate = plot.state;
                    }
                }
            });
            
            // 作業者による自動作業
            this.performFarmWork(farm);
        });
    }
    
    // 作物の成長を更新
    updateCropGrowth(plot, deltaTime, growthModifier) {
        if (plot.state === this.growthStages.HARVEST || 
            plot.state === this.growthStages.WITHERED) {
            return;
        }
        
        // 水分チェック
        if (plot.water <= 0) {
            plot.state = this.growthStages.WITHERED;
            return;
        }
        
        // 成長速度
        let growthRate = plot.crop.config.growthRate || 1.0;
        growthRate *= growthModifier;
        
        // 水分による成長速度修正
        if (plot.water < 50) {
            growthRate *= plot.water / 50;
        }
        
        plot.growth += deltaTime * growthRate;
        
        // 成長ステージの更新
        const growthTime = plot.crop.config.growthTime || 100;
        const growthPercent = (plot.growth / growthTime) * 100;
        
        if (growthPercent >= 100) {
            plot.state = this.growthStages.HARVEST;
        } else if (growthPercent >= 75) {
            plot.state = this.growthStages.MATURE;
        } else if (growthPercent >= 40) {
            plot.state = this.growthStages.GROWING;
        } else if (growthPercent >= 10) {
            plot.state = this.growthStages.SPROUT;
        }
    }
    
    // 農場作業を実行
    performFarmWork(farm) {
        if (farm.workers.length === 0) return;
        
        // 優先順位: 収穫 > 水やり > 植え付け
        
        // 収穫可能な作物を探す
        const harvestablePlots = farm.plots
            .map((plot, index) => ({ plot, index }))
            .filter(p => p.plot.state === this.growthStages.HARVEST);
        
        if (harvestablePlots.length > 0) {
            // ランダムに1つ収穫
            const target = harvestablePlots[Math.floor(Math.random() * harvestablePlots.length)];
            const harvest = this.harvestCrop(farm.id, target.index);
            if (harvest && window.game?.resourceManager) {
                window.game.resourceManager.add({ [harvest.type]: harvest.amount });
            }
            return;
        }
        
        // 水が必要な作物を探す
        const thirstyPlots = farm.plots
            .filter(plot => plot.crop && plot.water < 50);
        
        if (thirstyPlots.length > 0) {
            // 最も水が少ないプロットに水やり
            thirstyPlots.sort((a, b) => a.water - b.water);
            thirstyPlots[0].water = 100;
            return;
        }
        
        // 空いているプロットに植える
        const emptyPlots = farm.plots
            .map((plot, index) => ({ plot, index }))
            .filter(p => p.plot.state === this.growthStages.EMPTY);
        
        if (emptyPlots.length > 0 && window.game?.resourceManager) {
            // 利用可能な種を確認
            const availableSeeds = Object.keys(this.cropsConfig)
                .filter(crop => {
                    const seedResource = `${crop.toLowerCase()}_seed`;
                    return window.game.resourceManager.has(seedResource, 1);
                });
            
            if (availableSeeds.length > 0) {
                const cropType = availableSeeds[0];
                const target = emptyPlots[0];
                if (this.plantCrop(farm.id, target.index, cropType)) {
                    const seedResource = `${cropType.toLowerCase()}_seed`;
                    window.game.resourceManager.consume({ [seedResource]: 1 });
                }
            }
        }
    }
    
    // 作業者を割り当て
    assignWorker(farmId, workerId) {
        const farm = this.farms.get(farmId);
        if (!farm) return false;
        
        if (!farm.workers.includes(workerId)) {
            farm.workers.push(workerId);
            this.updateFarmProductivity(farm);
            return true;
        }
        
        return false;
    }
    
    // 作業者を削除
    removeWorker(farmId, workerId) {
        const farm = this.farms.get(farmId);
        if (!farm) return false;
        
        const index = farm.workers.indexOf(workerId);
        if (index > -1) {
            farm.workers.splice(index, 1);
            this.updateFarmProductivity(farm);
            return true;
        }
        
        return false;
    }
    
    // 農場の生産性を更新
    updateFarmProductivity(farm) {
        // 作業者数に応じて生産性を設定
        farm.productivity = 1.0 + (farm.workers.length * 0.2);
    }
    
    // 特定の農場を取得
    getFarm(farmId) {
        return this.farms.get(farmId);
    }
    
    // 建物に関連する農場を取得
    getFarmByBuilding(buildingId) {
        for (const [farmId, farm] of this.farms) {
            if (farm.building.id === buildingId) {
                return farm;
            }
        }
        return null;
    }
}