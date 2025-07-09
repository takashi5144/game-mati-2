// 生産チェーンシステム
export class ProductionSystem {
    constructor() {
        this.productionChains = new Map();
        this.recipes = new Map();
        this.activeProductions = [];
        
        this.initializeRecipes();
    }
    
    // レシピの初期化
    initializeRecipes() {
        // 基本的な生産レシピ
        this.addRecipe('wheat_to_flour', {
            name: '小麦粉製造',
            inputs: { wheat: 2 },
            outputs: { flour: 1 },
            time: 10,
            building: 'barn',
            worker: 'farmer'
        });
        
        this.addRecipe('flour_to_bread', {
            name: 'パン製造',
            inputs: { flour: 1, water: 1 },
            outputs: { bread: 2 },
            time: 15,
            building: 'bakery',
            worker: 'baker'
        });
        
        this.addRecipe('corn_to_feed', {
            name: '飼料製造',
            inputs: { corn: 3 },
            outputs: { animal_feed: 2 },
            time: 8,
            building: 'barn',
            worker: 'farmer'
        });
        
        this.addRecipe('wood_to_planks', {
            name: '板材製造',
            inputs: { wood: 1 },
            outputs: { planks: 2 },
            time: 5,
            building: 'lumbermill',
            worker: 'lumberjack'
        });
        
        this.addRecipe('planks_to_tools', {
            name: '木製道具製造',
            inputs: { planks: 2, iron: 1 },
            outputs: { tools: 1 },
            time: 20,
            building: 'blacksmith',
            worker: 'blacksmith'
        });
        
        this.addRecipe('stone_to_blocks', {
            name: '石材加工',
            inputs: { stone: 2 },
            outputs: { stone_blocks: 1 },
            time: 10,
            building: 'mason',
            worker: 'mason'
        });
        
        this.addRecipe('iron_to_ingots', {
            name: '鉄インゴット製造',
            inputs: { iron: 2, wood: 1 },
            outputs: { iron_ingots: 1 },
            time: 15,
            building: 'blacksmith',
            worker: 'blacksmith'
        });
        
        this.addRecipe('ingots_to_tools', {
            name: '鉄製道具製造',
            inputs: { iron_ingots: 1, planks: 1 },
            outputs: { iron_tools: 1 },
            time: 25,
            building: 'blacksmith',
            worker: 'blacksmith'
        });
        
        this.addRecipe('wheat_seed_production', {
            name: '小麦の種生産',
            inputs: { wheat: 1 },
            outputs: { wheat_seed: 3 },
            time: 5,
            building: 'barn',
            worker: 'farmer'
        });
        
        this.addRecipe('corn_seed_production', {
            name: 'とうもろこしの種生産',
            inputs: { corn: 1 },
            outputs: { corn_seed: 2 },
            time: 5,
            building: 'barn',
            worker: 'farmer'
        });
    }
    
    // レシピを追加
    addRecipe(id, recipe) {
        this.recipes.set(id, {
            id: id,
            ...recipe
        });
    }
    
    // 生産チェーンを作成
    createProductionChain(chainId, steps) {
        const chain = {
            id: chainId,
            steps: steps,
            currentStep: 0,
            status: 'idle',
            progress: 0
        };
        
        this.productionChains.set(chainId, chain);
        return chain;
    }
    
    // 生産を開始
    startProduction(buildingId, recipeId, quantity = 1) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            console.error(`Recipe ${recipeId} not found`);
            return false;
        }
        
        const building = window.game?.buildingSystem?.getBuilding(buildingId);
        if (!building || building.type !== recipe.building) {
            console.error(`Invalid building for recipe ${recipeId}`);
            return false;
        }
        
        // 材料チェック
        if (!this.checkResources(recipe.inputs, quantity)) {
            return false;
        }
        
        // 作業者チェック
        if (building.workers.length === 0) {
            console.error('No workers assigned to building');
            return false;
        }
        
        // 材料を消費
        this.consumeResources(recipe.inputs, quantity);
        
        // 生産を開始
        const production = {
            id: `prod_${Date.now()}`,
            buildingId: buildingId,
            recipeId: recipeId,
            recipe: recipe,
            quantity: quantity,
            progress: 0,
            timeRequired: recipe.time * quantity,
            startTime: Date.now()
        };
        
        this.activeProductions.push(production);
        console.log(`Started production: ${recipe.name} x${quantity}`);
        
        return true;
    }
    
    // リソースチェック
    checkResources(inputs, quantity = 1) {
        const resourceManager = window.game?.resourceManager;
        if (!resourceManager) return false;
        
        for (const [resource, amount] of Object.entries(inputs)) {
            if (!resourceManager.has(resource, amount * quantity)) {
                return false;
            }
        }
        
        return true;
    }
    
    // リソースを消費
    consumeResources(inputs, quantity = 1) {
        const resourceManager = window.game?.resourceManager;
        if (!resourceManager) return;
        
        const toConsume = {};
        for (const [resource, amount] of Object.entries(inputs)) {
            toConsume[resource] = amount * quantity;
        }
        
        resourceManager.consume(toConsume);
    }
    
    // リソースを生産
    produceResources(outputs, quantity = 1) {
        const resourceManager = window.game?.resourceManager;
        if (!resourceManager) return;
        
        const toProduce = {};
        for (const [resource, amount] of Object.entries(outputs)) {
            toProduce[resource] = amount * quantity;
        }
        
        resourceManager.add(toProduce);
    }
    
    // 更新処理
    update(deltaTime) {
        const completedProductions = [];
        
        this.activeProductions.forEach((production, index) => {
            // 進捗を更新
            production.progress += deltaTime;
            
            // 完了チェック
            if (production.progress >= production.timeRequired) {
                // 生産物を追加
                this.produceResources(production.recipe.outputs, production.quantity);
                
                console.log(`Production completed: ${production.recipe.name} x${production.quantity}`);
                
                // 完了リストに追加
                completedProductions.push(index);
                
                // 生産完了イベント
                if (window.game) {
                    window.game.ui.showNotification(
                        `${production.recipe.name} x${production.quantity} 完成しました`,
                        'success'
                    );
                }
            }
        });
        
        // 完了した生産を削除（逆順で）
        for (let i = completedProductions.length - 1; i >= 0; i--) {
            this.activeProductions.splice(completedProductions[i], 1);
        }
        
        // 自動生産の処理
        this.processAutoProduction();
    }
    
    // 自動生産の処理
    processAutoProduction() {
        if (!window.game?.buildingSystem) return;
        
        // 各建物の自動生産をチェック
        window.game.buildingSystem.buildings.forEach(building => {
            if (!building.isComplete || building.workers.length === 0) return;
            
            // 建物タイプに応じた自動生産
            switch (building.type) {
                case 'lumbermill':
                    this.tryAutoProduction(building.id, 'wood_to_planks');
                    break;
                case 'blacksmith':
                    // 優先順位で試行
                    if (!this.tryAutoProduction(building.id, 'iron_to_ingots')) {
                        if (!this.tryAutoProduction(building.id, 'ingots_to_tools')) {
                            this.tryAutoProduction(building.id, 'planks_to_tools');
                        }
                    }
                    break;
                case 'barn':
                    // 種が少なければ種を生産
                    const resourceManager = window.game.resourceManager;
                    if (resourceManager.resources.wheat_seed?.current < 10) {
                        this.tryAutoProduction(building.id, 'wheat_seed_production');
                    } else if (resourceManager.resources.corn_seed?.current < 10) {
                        this.tryAutoProduction(building.id, 'corn_seed_production');
                    } else {
                        // 通常の加工
                        if (!this.tryAutoProduction(building.id, 'wheat_to_flour')) {
                            this.tryAutoProduction(building.id, 'corn_to_feed');
                        }
                    }
                    break;
            }
        });
    }
    
    // 自動生産を試行
    tryAutoProduction(buildingId, recipeId) {
        // すでにこの建物で生産中か確認
        const isProducing = this.activeProductions.some(p => p.buildingId === buildingId);
        if (isProducing) return false;
        
        return this.startProduction(buildingId, recipeId, 1);
    }
    
    // 建物で利用可能なレシピを取得
    getAvailableRecipes(buildingType) {
        const available = [];
        
        this.recipes.forEach(recipe => {
            if (recipe.building === buildingType) {
                available.push(recipe);
            }
        });
        
        return available;
    }
    
    // 特定の建物の生産状況を取得
    getBuildingProduction(buildingId) {
        return this.activeProductions.filter(p => p.buildingId === buildingId);
    }
    
    // 生産の進捗率を取得
    getProductionProgress(productionId) {
        const production = this.activeProductions.find(p => p.id === productionId);
        if (!production) return 0;
        
        return production.progress / production.timeRequired;
    }
    
    // チェーンの可視化データを取得
    getChainVisualization(chainId) {
        const chain = this.productionChains.get(chainId);
        if (!chain) return null;
        
        const nodes = [];
        const links = [];
        
        chain.steps.forEach((step, index) => {
            const recipe = this.recipes.get(step);
            if (recipe) {
                nodes.push({
                    id: index,
                    name: recipe.name,
                    inputs: recipe.inputs,
                    outputs: recipe.outputs,
                    building: recipe.building
                });
                
                if (index > 0) {
                    links.push({
                        source: index - 1,
                        target: index
                    });
                }
            }
        });
        
        return { nodes, links };
    }
}