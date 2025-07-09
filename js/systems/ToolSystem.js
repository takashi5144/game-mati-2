// ツールシステム
export class ToolSystem {
    constructor(game) {
        this.game = game;
        this.currentTool = null;
        this.toolData = null;
        this.preview = null;
        this.validPlacement = false;
        
        // ツール設定
        this.tools = {
            // 建設ツール
            house: { 
                type: 'building', 
                buildingType: 'house',
                cursor: 'pointer',
                rangeSelection: false
            },
            farm: { 
                type: 'building', 
                buildingType: 'farm',
                cursor: 'pointer',
                rangeSelection: false
            },
            barn: { 
                type: 'building', 
                buildingType: 'barn',
                cursor: 'pointer',
                rangeSelection: false
            },
            lumbermill: { 
                type: 'building', 
                buildingType: 'lumbermill',
                cursor: 'pointer',
                rangeSelection: false
            },
            market: { 
                type: 'building', 
                buildingType: 'market',
                cursor: 'pointer',
                rangeSelection: false
            },
            blacksmith: { 
                type: 'building', 
                buildingType: 'blacksmith',
                cursor: 'pointer',
                rangeSelection: false
            },
            
            // 地形ツール
            'harvest-area': {
                type: 'zone',
                zoneType: 'harvest',
                cursor: 'crosshair',
                rangeSelection: true,
                color: 0x00FF00
            },
            'farm-zone': {
                type: 'zone',
                zoneType: 'farm',
                cursor: 'crosshair',
                rangeSelection: true,
                color: 0x8B4513
            },
            'clear-area': {
                type: 'zone',
                zoneType: 'clear',
                cursor: 'crosshair',
                rangeSelection: true,
                color: 0xFF0000
            },
            'stockpile': {
                type: 'zone',
                zoneType: 'stockpile',
                cursor: 'crosshair',
                rangeSelection: true,
                color: 0x0000FF
            },
            
            // その他のツール
            demolish: {
                type: 'action',
                action: 'demolish',
                cursor: 'not-allowed',
                rangeSelection: false
            },
            road: {
                type: 'path',
                pathType: 'road',
                cursor: 'pointer',
                rangeSelection: false
            }
        };
        
        // プレビューメッシュのグループ
        this.previewGroup = new THREE.Group();
        this.previewGroup.name = 'toolPreview';
        this.game.sceneManager.scene.add(this.previewGroup);
    }
    
    selectTool(toolId) {
        this.cancelTool();
        
        const tool = this.tools[toolId];
        if (!tool) {
            console.error(`Unknown tool: ${toolId}`);
            return;
        }
        
        this.currentTool = toolId;
        this.toolData = tool;
        
        // カーソルを更新
        this.game.renderer.domElement.style.cursor = tool.cursor;
        
        // UIを更新
        this.game.ui.updateToolSelection(toolId);
        
        console.log(`Tool selected: ${toolId}`);
    }
    
    cancelTool() {
        if (this.preview) {
            this.previewGroup.remove(this.preview);
            this.preview = null;
        }
        
        this.currentTool = null;
        this.toolData = null;
        this.validPlacement = false;
        
        // カーソルをリセット
        this.game.renderer.domElement.style.cursor = 'grab';
        
        // UIを更新
        this.game.ui.updateToolSelection(null);
    }
    
    handleClick(worldPos) {
        if (!this.currentTool || !this.toolData) return;
        
        switch (this.toolData.type) {
            case 'building':
                this.placeBuilding(worldPos);
                break;
            case 'action':
                this.performAction(worldPos);
                break;
            case 'path':
                this.placePath(worldPos);
                break;
        }
    }
    
    handleRangeSelection(start, end) {
        if (!this.currentTool || !this.toolData || !this.toolData.rangeSelection) return;
        
        const minX = Math.floor(Math.min(start.x, end.x));
        const maxX = Math.ceil(Math.max(start.x, end.x));
        const minZ = Math.floor(Math.min(start.z, end.z));
        const maxZ = Math.ceil(Math.max(start.z, end.z));
        
        switch (this.toolData.type) {
            case 'zone':
                this.createZone(minX, minZ, maxX - minX, maxZ - minZ);
                break;
        }
    }
    
    needsRangeSelection() {
        return this.toolData && this.toolData.rangeSelection;
    }
    
    updatePreview(worldPos) {
        if (!this.currentTool || !this.toolData) return;
        
        if (this.toolData.type === 'building') {
            this.updateBuildingPreview(worldPos);
        }
    }
    
    updateBuildingPreview(worldPos) {
        const buildingConfig = this.game.config.BUILDINGS[this.toolData.buildingType.toUpperCase()];
        if (!buildingConfig) return;
        
        const gridX = Math.floor(worldPos.x) + 0.5;
        const gridZ = Math.floor(worldPos.z) + 0.5;
        
        // プレビューメッシュを作成（初回のみ）
        if (!this.preview) {
            const geometry = new THREE.BoxGeometry(
                buildingConfig.size?.width || 1,
                buildingConfig.size?.height || 2,
                buildingConfig.size?.depth || 1
            );
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.5
            });
            this.preview = new THREE.Mesh(geometry, material);
            this.previewGroup.add(this.preview);
        }
        
        // 位置を更新
        this.preview.position.set(gridX, 1, gridZ);
        
        // 配置可能かチェック
        this.validPlacement = this.checkValidPlacement(gridX, gridZ, buildingConfig);
        
        // 色を更新
        const color = this.validPlacement ? 0x00FF00 : 0xFF0000;
        this.preview.material.color.setHex(color);
    }
    
    checkValidPlacement(x, z, buildingConfig) {
        // 地形の境界チェック
        const terrainSize = this.game.config.TERRAIN.SIZE;
        if (x < 0 || x >= terrainSize || z < 0 || z >= terrainSize) {
            return false;
        }
        
        // 他の建物との衝突チェック
        const buildings = this.game.buildingSystem.buildings;
        for (const building of buildings) {
            const dx = Math.abs(building.x - x);
            const dz = Math.abs(building.z - z);
            if (dx < 2 && dz < 2) { // 簡易的な衝突判定
                return false;
            }
        }
        
        return true;
    }
    
    placeBuilding(worldPos) {
        const buildingConfig = this.game.config.BUILDINGS[this.toolData.buildingType.toUpperCase()];
        if (!buildingConfig) return;
        
        const gridX = Math.floor(worldPos.x) + 0.5;
        const gridZ = Math.floor(worldPos.z) + 0.5;
        
        if (!this.checkValidPlacement(gridX, gridZ, buildingConfig)) {
            console.log('Invalid placement location');
            return;
        }
        
        // リソースチェック
        if (!this.game.resourceManager.canAfford(buildingConfig.cost)) {
            this.game.ui.showNotification('リソースが不足しています', 'error');
            return;
        }
        
        // 建物を配置
        const success = this.game.buildingSystem.placeBuilding(
            gridX, 
            gridZ, 
            this.toolData.buildingType
        );
        
        if (success) {
            // リソースを消費
            this.game.resourceManager.consume(buildingConfig.cost);
            
            // UIを更新
            this.game.ui.updateResourceDisplay(this.game.resourceManager.resources);
            
            // 効果音を再生（実装されている場合）
            // this.game.audioManager.playSound('place_building');
        }
    }
    
    performAction(worldPos) {
        if (this.toolData.action === 'demolish') {
            // レイキャストで建物を検出
            const raycaster = new THREE.Raycaster();
            const origin = new THREE.Vector3(worldPos.x, 10, worldPos.z);
            const direction = new THREE.Vector3(0, -1, 0);
            raycaster.set(origin, direction);
            
            const buildings = this.game.sceneManager.scene.getObjectByName('buildings');
            if (buildings) {
                const intersects = raycaster.intersectObjects(buildings.children, true);
                if (intersects.length > 0) {
                    const building = intersects[0].object.userData.building;
                    if (building) {
                        this.demolishBuilding(building);
                    }
                }
            }
        }
    }
    
    demolishBuilding(building) {
        if (!building || !building.id) return;
        
        // 建物を削除
        const success = this.game.buildingSystem.demolishBuilding(building.id);
        
        if (success) {
            // 一部のリソースを返却（50%）
            const refund = {};
            for (const [resource, amount] of Object.entries(building.config.cost)) {
                refund[resource] = Math.floor(amount * 0.5);
            }
            this.game.resourceManager.add(refund);
            
            // UIを更新
            this.game.ui.updateResourceDisplay(this.game.resourceManager.resources);
            
            // 効果音を再生（実装されている場合）
            // this.game.audioManager.playSound('demolish_building');
        }
    }
    
    placePath(worldPos) {
        // 道路の配置（後で実装）
        console.log('Placing road at:', worldPos);
    }
    
    createZone(x, z, width, height) {
        console.log(`Creating ${this.toolData.zoneType} zone at (${x}, ${z}) with size ${width}x${height}`);
        
        // ゾーンの視覚表示を作成
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            color: this.toolData.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const zone = new THREE.Mesh(geometry, material);
        zone.rotation.x = -Math.PI / 2;
        zone.position.set(x + width / 2, 0.1, z + height / 2);
        
        // ゾーンデータを保存
        zone.userData = {
            type: 'zone',
            zoneType: this.toolData.zoneType,
            x: x,
            z: z,
            width: width,
            height: height
        };
        
        this.game.sceneManager.scene.add(zone);
        
        // ゾーンタイプに応じた処理
        switch (this.toolData.zoneType) {
            case 'harvest':
                this.markTreesForHarvest(x, z, width, height);
                break;
            case 'farm':
                this.designateFarmland(x, z, width, height);
                break;
            case 'clear':
                this.markAreaForClearing(x, z, width, height);
                break;
            case 'stockpile':
                this.createStockpile(x, z, width, height);
                break;
        }
    }
    
    markTreesForHarvest(x, z, width, height) {
        // 範囲内の木をマーク
        console.log('Marking trees for harvest in area');
    }
    
    designateFarmland(x, z, width, height) {
        // 農地として指定
        console.log('Designating farmland');
    }
    
    markAreaForClearing(x, z, width, height) {
        // 整地エリアをマーク
        console.log('Marking area for clearing');
    }
    
    createStockpile(x, z, width, height) {
        // 貯蔵エリアを作成
        console.log('Creating stockpile area');
    }
    
    update(deltaTime) {
        // プレビューの更新
        if (this.currentTool && this.preview) {
            const mousePos = this.game.inputHandler.getMouseWorldPosition();
            if (mousePos) {
                this.updatePreview(mousePos);
            }
        }
    }
}