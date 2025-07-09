// ゲームのメインクラス
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { CameraController } from './CameraController.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { ResourceManager } from '../systems/ResourceManager.js';
import { BuildingSystem } from '../systems/BuildingSystem.js';
import { ResidentSystem } from '../systems/ResidentSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { TerrainGenerator } from '../world/TerrainGenerator.js';
import { EventSystem } from '../systems/EventSystem.js';

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
        this.cameraController = null;
        this.inputManager = null;
        
        // ゲームシステム
        this.uiManager = null;
        this.resourceManager = null;
        this.buildingSystem = null;
        this.residentSystem = null;
        this.timeSystem = null;
        this.terrainGenerator = null;
        this.eventSystem = null;
        
        // ゲーム状態
        this.selectedObject = null;
        this.currentTool = null;
        this.buildMode = null;
    }

    async init() {
        console.log('🎮 Game.init() 開始');
        
        // レンダラーの初期化
        this.renderer = new Renderer(this.config.GRAPHICS);
        this.renderer.init();
        
        // シーン管理の初期化
        this.sceneManager = new SceneManager();
        this.sceneManager.init();
        
        // カメラコントローラーの初期化
        this.cameraController = new CameraController(
            this.renderer.camera,
            this.renderer.domElement,
            this.config.CONTROLS.MOUSE
        );
        
        // 入力管理の初期化
        this.inputManager = new InputManager(this.config.CONTROLS);
        this.inputManager.init(this.renderer.domElement);
        this.setupInputHandlers();
        
        // UI管理の初期化
        this.uiManager = new UIManager(this);
        this.uiManager.init();
        
        // ゲームシステムの初期化
        await this.initGameSystems();
        
        // 地形の生成
        await this.generateWorld();
        
        // 初期建物の配置
        this.placeInitialBuildings();
        
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
        scene.add(ambientLight);
        
        // 太陽光
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
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
        this.uiManager.updateResourceDisplay(this.resourceManager.resources);
        this.uiManager.updatePopulation(
            this.residentSystem.getPopulation(),
            this.residentSystem.getMaxPopulation()
        );
    }

    setupInputHandlers() {
        // マウスイベント
        this.inputManager.on('mousedown', (e) => this.onMouseDown(e));
        this.inputManager.on('mouseup', (e) => this.onMouseUp(e));
        this.inputManager.on('mousemove', (e) => this.onMouseMove(e));
        this.inputManager.on('wheel', (e) => this.onMouseWheel(e));
        this.inputManager.on('click', (e) => this.onClick(e));
        
        // キーボードイベント
        this.inputManager.on('keydown', (e) => this.onKeyDown(e));
        
        // タッチイベント（モバイル対応）
        this.inputManager.on('touchstart', (e) => this.onTouchStart(e));
        this.inputManager.on('touchmove', (e) => this.onTouchMove(e));
        this.inputManager.on('touchend', (e) => this.onTouchEnd(e));
    }

    // マウスイベントハンドラー
    onMouseDown(event) {
        if (event.button === 0) { // 左クリック
            if (this.currentTool && this.isAreaTool(this.currentTool)) {
                this.startAreaSelection(event);
            }
        }
        this.cameraController.onMouseDown(event);
    }

    onMouseUp(event) {
        if (this.isSelectingArea) {
            this.completeAreaSelection();
        }
        this.cameraController.onMouseUp(event);
    }

    onMouseMove(event) {
        if (this.isSelectingArea) {
            this.updateAreaSelection(event);
        }
        this.cameraController.onMouseMove(event);
        
        // ホバー効果の更新
        this.updateHoverEffect(event);
    }

    onMouseWheel(event) {
        this.cameraController.onMouseWheel(event);
    }

    onClick(event) {
        if (event.button === 2) { // 右クリック
            this.cancelCurrentTool();
            return;
        }
        
        if (event.button === 0 && !this.cameraController.isDragging) { // 左クリック
            this.handleClick(event);
        }
    }

    // キーボードイベントハンドラー
    onKeyDown(event) {
        const key = event.key.toUpperCase();
        const action = this.config.CONTROLS.KEYBOARD[key];
        
        if (!action) return;
        
        switch (action) {
            case 'pause_toggle':
                this.togglePause();
                break;
            case 'speed_normal':
                this.setGameSpeed(this.config.GAME.SPEED.NORMAL);
                break;
            case 'speed_fast':
                this.setGameSpeed(this.config.GAME.SPEED.FAST);
                break;
            case 'speed_very_fast':
                this.setGameSpeed(this.config.GAME.SPEED.VERY_FAST);
                break;
            case 'toggle_build_menu':
                this.uiManager.toggleBuildMenu();
                break;
            case 'toggle_resident_panel':
                this.uiManager.toggleResidentPanel();
                break;
            case 'cancel':
                this.cancelCurrentTool();
                break;
            default:
                // カメラコントロール
                if (action.startsWith('camera_')) {
                    this.cameraController.handleKeyboard(action);
                }
                // ツールショートカット
                else if (action.startsWith('tool_')) {
                    const tool = action.replace('tool_', '');
                    this.setCurrentTool(tool);
                }
                break;
        }
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
        // カメラの更新
        this.cameraController.update(deltaTime);
        
        // ゲームシステムの更新
        this.timeSystem.update(deltaTime);
        this.residentSystem.update(deltaTime);
        this.buildingSystem.update(deltaTime);
        this.resourceManager.update(deltaTime, this.residentSystem.getPopulation());
        this.eventSystem.update(deltaTime);
        
        // UIの更新
        this.uiManager.update(deltaTime);
    }

    render() {
        this.renderer.render(this.sceneManager.scene, this.renderer.camera);
    }

    // ゲーム状態管理
    togglePause() {
        this.isPaused = !this.isPaused;
        this.uiManager.updatePauseButton(this.isPaused);
        console.log(this.isPaused ? '⏸️ ゲーム一時停止' : '▶️ ゲーム再開');
    }

    setGameSpeed(speed) {
        this.gameSpeed = speed;
        this.uiManager.updateSpeedButtons(speed);
        console.log(`⏩ ゲーム速度: ${speed}x`);
    }

    setCurrentTool(tool) {
        this.currentTool = tool;
        this.buildMode = tool;
        this.uiManager.updateToolSelection(tool);
        
        // カーソルの更新
        const cursorType = this.getToolCursor(tool);
        this.renderer.domElement.style.cursor = cursorType;
    }

    cancelCurrentTool() {
        this.currentTool = null;
        this.buildMode = null;
        this.uiManager.updateToolSelection(null);
        this.renderer.domElement.style.cursor = 'grab';
    }

    // ツール関連のヘルパーメソッド
    isAreaTool(tool) {
        return ['harvest-area', 'farm-zone', 'clear-area', 'stockpile'].includes(tool);
    }

    getToolCursor(tool) {
        if (this.isAreaTool(tool)) return 'crosshair';
        if (tool === 'demolish') return 'not-allowed';
        if (tool) return 'pointer';
        return 'grab';
    }

    // クリック処理
    handleClick(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const rect = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.renderer.camera);
        
        // 地形との交差判定
        const intersects = raycaster.intersectObjects(this.sceneManager.scene.children, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            const object = intersects[0].object;
            
            // オブジェクトの種類に応じて処理
            if (object.userData.type === 'terrain') {
                this.handleTerrainClick(point.x, point.z);
            } else if (object.userData.type === 'building') {
                this.handleBuildingClick(object.userData.building);
            } else if (object.userData.type === 'resident') {
                this.handleResidentClick(object.userData.resident);
            }
        }
    }

    handleTerrainClick(x, z) {
        if (this.currentTool) {
            // 建物配置
            if (this.config.BUILDINGS[this.currentTool.toUpperCase()]) {
                this.tryPlaceBuilding(x, z, this.currentTool);
            }
        }
    }

    handleBuildingClick(building) {
        this.selectObject(building);
        this.uiManager.showBuildingInfo(building);
    }

    handleResidentClick(resident) {
        this.selectObject(resident);
        this.uiManager.showResidentInfo(resident);
    }

    tryPlaceBuilding(x, z, buildingType) {
        const config = this.config.BUILDINGS[buildingType.toUpperCase()];
        
        // 資源チェック
        if (!this.resourceManager.canAfford(config.cost)) {
            this.uiManager.showNotification('資源が不足しています', 'error');
            return;
        }
        
        // 配置可能かチェック
        if (!this.buildingSystem.canPlaceAt(x, z, buildingType)) {
            this.uiManager.showNotification('ここには建設できません', 'error');
            return;
        }
        
        // 建物を配置
        const building = this.buildingSystem.placeBuilding(x, z, buildingType);
        if (building) {
            this.resourceManager.consume(config.cost);
            this.uiManager.showNotification(`${config.name}の建設を開始しました`, 'success');
            this.hasChanges = true;
        }
    }

    // イベントハンドラー
    onDayChanged(day) {
        this.uiManager.updateDate(day);
    }

    onSeasonChanged(season) {
        this.uiManager.updateSeason(season);
        // 季節に応じた環境変更
        this.updateEnvironmentForSeason(season);
    }

    onEventTriggered(event) {
        this.uiManager.showEventNotification(event);
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
        this.renderer.onWindowResize();
        this.cameraController.onWindowResize();
    }

    // エリア選択関連
    startAreaSelection(event) {
        this.isSelectingArea = true;
        this.selectionStart = { x: event.clientX, y: event.clientY };
        this.uiManager.showSelectionBox(this.selectionStart.x, this.selectionStart.y);
    }

    updateAreaSelection(event) {
        if (!this.isSelectingArea) return;
        this.uiManager.updateSelectionBox(
            this.selectionStart.x,
            this.selectionStart.y,
            event.clientX,
            event.clientY
        );
    }

    completeAreaSelection() {
        if (!this.isSelectingArea) return;
        this.isSelectingArea = false;
        this.uiManager.hideSelectionBox();
        
        // エリア内のオブジェクトを処理
        // TODO: 実装
    }

    updateHoverEffect(event) {
        // ホバー効果の実装
        // TODO: 実装
    }

    selectObject(object) {
        if (this.selectedObject) {
            // 前の選択を解除
        }
        this.selectedObject = object;
        // 選択エフェクトを追加
    }
}