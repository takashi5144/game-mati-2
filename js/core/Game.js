// ゲームのメインクラス
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { InputHandler } from './InputHandler.js';
import { UIManager } from '../ui/UIManager.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { BuildingSystem } from '../systems/BuildingSystem.js';
import { ResidentSystem } from '../systems/ResidentSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { TerrainGenerator } from '../world/TerrainGenerator.js';
import { EventSystem } from '../systems/EventSystem.js';
import { ToolSystem } from '../systems/ToolSystem.js';
import { CursorVisualizer } from '../ui/CursorVisualizer.js';
import { FarmingSystem } from '../systems/FarmingSystem.js';
import { ProductionSystem } from '../systems/ProductionSystem.js';
import { SaveLoadSystem } from '../systems/SaveLoadSystem.js';
import { SaveLoadUI } from '../ui/SaveLoadUI.js';
import { WeatherSystem } from '../systems/WeatherSystem.js';
import { WeatherUI } from '../ui/WeatherUI.js';
import { EconomySystem } from '../systems/EconomySystem.js';
import { MarketUI } from '../ui/MarketUI.js';
import { TutorialSystem } from '../systems/TutorialSystem.js';
import { DisasterSystem } from '../systems/DisasterSystem.js';

export class Game {
    constructor(config) {
        this.config = config;
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = config.GAME.SPEED.NORMAL;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.hasChanges = false;
        
        // コアシステム
        this.renderer = null;
        this.sceneManager = null;
        this.inputHandler = null;
        this.ui = null;
        this.toolSystem = null;
        this.cursorVisualizer = null;
        
        // ゲームシステム
        this.uiManager = null;
        this.resourceManager = null;
        this.buildingSystem = null;
        this.residentSystem = null;
        this.farmingSystem = null;
        this.productionSystem = null;
        this.timeSystem = null;
        this.terrainGenerator = null;
        this.eventSystem = null;
        this.saveLoadSystem = null;
        this.saveLoadUI = null;
        this.weatherSystem = null;
        this.weatherUI = null;
        this.economySystem = null;
        this.marketUI = null;
        this.tutorialSystem = null;
        this.disasterSystem = null;
        
        // ゲーム状態
        this.selectedObject = null;
        this.currentTool = null;
        this.buildMode = null;
    }

    async init() {
        console.log('🎮 Game.init() 開始');
        
        try {
            // レンダラーの初期化
            console.log('レンダラー初期化中...');
            this.renderer = new Renderer(this.config.GRAPHICS);
            this.renderer.init();
            console.log('レンダラー初期化完了');
            
            // シーン管理の初期化
            console.log('シーンマネージャー初期化中...');
            this.sceneManager = new SceneManager();
            this.sceneManager.init();
            console.log('シーンマネージャー初期化完了');
            
            // 入力ハンドラーの初期化
            console.log('入力ハンドラー初期化中...');
            this.inputHandler = new InputHandler(this);
            console.log('入力ハンドラー初期化完了');
            
            // ツールシステムの初期化
            console.log('ツールシステム初期化中...');
            this.toolSystem = new ToolSystem(this);
            console.log('ツールシステム初期化完了');
        } catch (error) {
            console.error('Game.init() エラー:', error);
            throw error;
        }
        
        // UI管理の初期化
        this.ui = new UIManager(this);
        this.ui.init();
        this.uiManager = this.ui; // 互換性のため
        
        // カーソルビジュアライザーの初期化
        this.cursorVisualizer = new CursorVisualizer(this.sceneManager.scene);
        
        // ゲームシステムの初期化
        await this.initGameSystems();
        
        // 地形の生成
        await this.generateWorld();
        
        // 初期建物の配置
        this.placeInitialBuildings();
        
        // ウィンドウリサイズイベント
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('✅ Game.init() 完了');
    }

    async initGameSystems() {
        // リソース管理
        this.resourceManager = new ResourceManager(this.config.INITIAL_RESOURCES);
        
        // 時間システム
        this.timeSystem = new TimeSystem(this.config.SEASONS);
        this.timeSystem.on('dayChanged', (day) => this.onDayChanged(day));
        this.timeSystem.on('seasonChanged', (season) => this.onSeasonChanged(season));
        
        // 建物システム
        this.buildingSystem = new BuildingSystem(
            this.sceneManager.scene,
            this.config.BUILDINGS
        );
        
        // 住民システム
        this.residentSystem = new ResidentSystem(
            this.sceneManager.scene,
            this.config.PROFESSIONS,
            this.config.NEEDS
        );
        
        // イベントシステム
        this.eventSystem = new EventSystem(this.config.EVENTS);
        this.eventSystem.on('eventTriggered', (event) => this.onEventTriggered(event));
        
        // 農業システム
        this.farmingSystem = new FarmingSystem(
            this.sceneManager.scene,
            this.config.CROPS,
            this.config.SEASONS
        );
        
        // 生産システム
        this.productionSystem = new ProductionSystem();
        
        // セーブ/ロードシステム
        this.saveLoadSystem = new SaveLoadSystem(this);
        this.saveLoadSystem.init();
        
        // セーブ/ロードUI
        this.saveLoadUI = new SaveLoadUI(this.ui, this.saveLoadSystem);
        this.saveLoadUI.init();
        
        // 天候システム
        this.weatherSystem = new WeatherSystem(this.sceneManager.scene, this.config.GRAPHICS.environment);
        this.weatherSystem.init();
        
        // 天候UI
        this.weatherUI = new WeatherUI(this.ui, this.weatherSystem);
        this.weatherUI.init();
        
        // 経済システム
        this.economySystem = new EconomySystem(this);
        this.economySystem.init();
        
        // 市場UI
        this.marketUI = new MarketUI(this.ui, this.economySystem);
        this.marketUI.init();
        
        // チュートリアルシステム
        this.tutorialSystem = new TutorialSystem(this);
        this.tutorialSystem.init();
        
        // 災害システム
        this.disasterSystem = new DisasterSystem(this);
        this.disasterSystem.init();
    }

    async generateWorld() {
        console.log('🌍 ワールド生成開始');
        
        this.terrainGenerator = new TerrainGenerator(
            this.config.TERRAIN,
            this.sceneManager.scene
        );
        
        await this.terrainGenerator.generate();
        
        // ライティングの設定
        this.setupLighting();
        
        console.log('✅ ワールド生成完了');
    }

    setupLighting() {
        const scene = this.sceneManager.scene;
        
        // 環境光
        const ambientLight = new THREE.HemisphereLight(
            0x87CEEB, // 空の色
            0x497749, // 地面の色
            0.4
        );
        ambientLight.name = 'ambientLight';
        scene.add(ambientLight);
        
        // 太陽光
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        sunLight.name = 'sunLight';
        sunLight.position.set(50, 100, 50);
        sunLight.castShadow = true;
        
        // シャドウマップの設定
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        scene.add(sunLight);
        this.sceneManager.sunLight = sunLight;
        
        // フォグ
        if (this.config.GRAPHICS.environment.fog.enabled) {
            scene.fog = new THREE.Fog(
                this.config.GRAPHICS.environment.fog.color,
                this.config.GRAPHICS.environment.fog.near,
                this.config.GRAPHICS.environment.fog.far
            );
        }
    }

    placeInitialBuildings() {
        console.log('🏠 初期建物配置');
        
        const centerX = this.config.TERRAIN.SIZE / 2;
        const centerZ = this.config.TERRAIN.SIZE / 2;
        
        // 納屋を中央に配置
        this.buildingSystem.placeBuilding(centerX, centerZ, 'barn', true);
        
        // 家を配置
        this.buildingSystem.placeBuilding(centerX - 5, centerZ, 'house', true);
        
        // 畑を配置
        this.buildingSystem.placeBuilding(centerX, centerZ - 5, 'farm', true);
        this.buildingSystem.placeBuilding(centerX + 3, centerZ - 5, 'farm', true);
        
        // 初期住民を生成
        this.residentSystem.spawnResident(centerX - 2, centerZ, 'none', '住民①');
        this.residentSystem.spawnResident(centerX + 2, centerZ, 'none', '住民②');
        
        // リソースを更新
        this.ui.updateResourceDisplay(this.resourceManager.resources);
        this.ui.updatePopulation(
            this.residentSystem.getPopulation(),
            this.residentSystem.getMaxPopulation()
        );
    }


    // ゲームループ
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('🎮 ゲーム開始');
    }

    stop() {
        this.isRunning = false;
        console.log('🛑 ゲーム停止');
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.gameLoop());
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(this.deltaTime * this.gameSpeed);
        }
        
        this.render();
    }

    update(deltaTime) {
        // 入力の更新
        this.inputHandler.update(deltaTime);
        
        // ツールシステムの更新
        this.toolSystem.update(deltaTime);
        
        // カーソルの更新
        const mousePos = this.inputHandler.getMouseWorldPosition();
        if (mousePos) {
            this.cursorVisualizer.updateCursorPosition(mousePos);
            this.cursorVisualizer.showCursor(true);
        } else {
            this.cursorVisualizer.showCursor(false);
        }
        
        // ゲームシステムの更新
        this.timeSystem.update(deltaTime);
        this.weatherSystem.update(deltaTime, this.timeSystem.currentSeason);
        this.residentSystem.update(deltaTime);
        this.buildingSystem.update(deltaTime);
        this.farmingSystem.update(deltaTime);
        this.productionSystem.update(deltaTime);
        this.economySystem.update(deltaTime);
        this.resourceManager.update(deltaTime, this.residentSystem.getPopulation());
        this.eventSystem.update(deltaTime);
        this.disasterSystem.update(deltaTime);
        
        // UIの更新
        this.ui.update(deltaTime);
        this.weatherUI.update();
        const weather = this.weatherSystem.getCurrentWeatherInfo();
        this.ui.updateWeather(weather.type);
    }

    render() {
        this.renderer.render(this.sceneManager.scene, this.renderer.camera);
    }

    // ゲーム状態管理
    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui.updatePauseButton(this.isPaused);
        console.log(this.isPaused ? '⏸️ ゲーム一時停止' : '▶️ ゲーム再開');
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.ui.updateSpeedButtons(speed);
        console.log(`⏩ ゲーム速度: ${speed}x`);
    }



    // イベントハンドラー
    onDayChanged(day) {
        this.ui.updateDate(day);
    }

    onSeasonChanged(season) {
        this.ui.updateSeason(season);
        // 季節に応じた環境変更
        this.updateEnvironmentForSeason(season);
    }

    onEventTriggered(event) {
        this.ui.showEventNotification(event);
        // イベントの効果を適用
        this.applyEventEffects(event);
    }

    updateEnvironmentForSeason(season) {
        const config = this.config.SEASONS[season];
        // ライティングの調整
        if (this.sceneManager.sunLight) {
            const intensity = season === 'WINTER' ? 0.6 : 1.0;
            this.sceneManager.sunLight.intensity = intensity;
        }
        // フォグの色調整
        if (this.sceneManager.scene.fog) {
            this.sceneManager.scene.fog.color.setHex(config.color);
        }
    }

    applyEventEffects(event) {
        // イベントの効果を実装
        console.log('イベント効果適用:', event);
    }

    // その他のメソッド
    hasUnsavedChanges() {
        return this.hasChanges;
    }

    onWindowResize() {
        if (this.renderer) {
            this.renderer.camera.aspect = window.innerWidth / window.innerHeight;
            this.renderer.camera.updateProjectionMatrix();
            this.renderer.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    // ゲーム速度の設定
    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.ui?.updateSpeedButtons(speed);
    }
    
    // ポーズ切り替え
    togglePause() {
        this.isPaused = !this.isPaused;
        this.ui?.updatePauseButton(this.isPaused);
    }
    
    // 変更フラグをセット
    setHasChanges(value) {
        this.hasChanges = value;
    }
    
    // カメラアクセサ
    get camera() {
        return this.renderer?.camera;
    }
    
    get controls() {
        return this.inputHandler;
    }
    
    // シーンアクセサ
    get scene() {
        return this.sceneManager?.scene;
    }
    
    // デバッグ用：手動で災害を発生させる
    triggerDisaster(type) {
        if (this.disasterSystem) {
            this.disasterSystem.triggerManualDisaster(type);
        }
    }

}