// 入力処理クラス
export class InputHandler {
    constructor(game) {
        this.game = game;
        this.camera = game.renderer.camera;
        this.domElement = game.renderer.domElement;
        
        // マウス状態
        this.mouse = { x: 0, y: 0 };
        this.mouseDown = { left: false, middle: false, right: false };
        this.lastMouse = { x: 0, y: 0 };
        
        // キー状態
        this.keys = {};
        
        // カメラコントロール設定
        this.cameraSpeed = 0.5;
        this.rotationSpeed = 0.005;
        this.zoomSpeed = 2;
        this.minZoom = 10;
        this.maxZoom = 100;
        
        // カメラターゲット
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        this.cameraDistance = 50;
        this.cameraRotation = { theta: Math.PI / 4, phi: Math.PI / 3 };
        
        // レイキャスター
        this.raycaster = new THREE.Raycaster();
        this.mouseWorldPos = new THREE.Vector3();
        
        // 選択範囲
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        
        this.init();
    }
    
    init() {
        // マウスイベント
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('wheel', this.onWheel.bind(this));
        this.domElement.addEventListener('contextmenu', e => e.preventDefault());
        
        // キーボードイベント
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // タッチイベント（モバイル対応）
        this.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // 初期カメラ位置
        this.updateCameraPosition();
    }
    
    onMouseDown(event) {
        const rect = this.domElement.getBoundingClientRect();
        this.lastMouse.x = event.clientX - rect.left;
        this.lastMouse.y = event.clientY - rect.top;
        
        switch (event.button) {
            case 0: // 左クリック
                this.mouseDown.left = true;
                this.handleLeftClick(event);
                break;
            case 1: // 中クリック
                this.mouseDown.middle = true;
                event.preventDefault();
                break;
            case 2: // 右クリック
                this.mouseDown.right = true;
                event.preventDefault();
                break;
        }
    }
    
    onMouseMove(event) {
        const rect = this.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        const currentX = event.clientX - rect.left;
        const currentY = event.clientY - rect.top;
        const deltaX = currentX - this.lastMouse.x;
        const deltaY = currentY - this.lastMouse.y;
        
        // 中ボタンドラッグ: カメラパン
        if (this.mouseDown.middle) {
            const panSpeed = this.cameraDistance * 0.001;
            const forward = new THREE.Vector3(
                Math.sin(this.cameraRotation.theta),
                0,
                Math.cos(this.cameraRotation.theta)
            );
            const right = new THREE.Vector3(
                Math.cos(this.cameraRotation.theta),
                0,
                -Math.sin(this.cameraRotation.theta)
            );
            
            this.cameraTarget.add(right.multiplyScalar(-deltaX * panSpeed));
            this.cameraTarget.add(forward.multiplyScalar(deltaY * panSpeed));
        }
        
        // 右ボタンドラッグ: カメラ回転
        if (this.mouseDown.right) {
            this.cameraRotation.theta -= deltaX * this.rotationSpeed;
            this.cameraRotation.phi = Math.max(
                0.1,
                Math.min(Math.PI / 2 - 0.1, this.cameraRotation.phi - deltaY * this.rotationSpeed)
            );
        }
        
        // 左ボタンドラッグ: 範囲選択
        if (this.mouseDown.left && this.isSelecting) {
            this.selectionEnd = { x: currentX, y: currentY };
            this.updateSelection();
        }
        
        this.lastMouse.x = currentX;
        this.lastMouse.y = currentY;
        
        // マウス位置のワールド座標を更新
        this.updateMouseWorldPosition();
    }
    
    onMouseUp(event) {
        switch (event.button) {
            case 0: // 左クリック
                this.mouseDown.left = false;
                if (this.isSelecting) {
                    this.finishSelection();
                }
                break;
            case 1: // 中クリック
                this.mouseDown.middle = false;
                break;
            case 2: // 右クリック
                this.mouseDown.right = false;
                this.handleRightClick(event);
                break;
        }
    }
    
    onWheel(event) {
        event.preventDefault();
        
        // ズーム処理
        const delta = event.deltaY > 0 ? 1 : -1;
        this.cameraDistance = Math.max(
            this.minZoom,
            Math.min(this.maxZoom, this.cameraDistance + delta * this.zoomSpeed)
        );
    }
    
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        // ショートカットキー
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.game.togglePause();
                break;
            case 'Digit1':
                this.game.setGameSpeed(1);
                break;
            case 'Digit2':
                this.game.setGameSpeed(2);
                break;
            case 'Digit3':
                this.game.setGameSpeed(5);
                break;
            case 'KeyB':
                this.game.ui.openBuildMenu();
                break;
            case 'KeyP':
                this.game.ui.openResidentPanel();
                break;
            case 'Escape':
                this.game.toolSystem.cancelTool();
                break;
        }
    }
    
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            // シングルタッチ: 左クリック相当
            const touch = event.touches[0];
            this.handleTouch(touch, 'start');
        } else if (event.touches.length === 2) {
            // ダブルタッチ: ピンチ/パン
            this.handleMultiTouch(event.touches, 'start');
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.handleTouch(touch, 'move');
        } else if (event.touches.length === 2) {
            this.handleMultiTouch(event.touches, 'move');
        }
    }
    
    onTouchEnd(event) {
        if (event.touches.length === 0) {
            this.handleTouch(null, 'end');
        }
    }
    
    handleTouch(touch, phase) {
        // タッチイベントの処理（モバイル対応）
        // 実装は必要に応じて追加
    }
    
    handleMultiTouch(touches, phase) {
        // マルチタッチの処理（ピンチズーム等）
        // 実装は必要に応じて追加
    }
    
    handleLeftClick(event) {
        const rect = this.domElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // ツールシステムのクリック処理
        if (this.game.toolSystem && this.game.toolSystem.currentTool) {
            this.game.toolSystem.handleClick(this.mouseWorldPos);
            
            // 範囲選択ツールの場合
            if (this.game.toolSystem.needsRangeSelection()) {
                this.isSelecting = true;
                this.selectionStart = { x, y };
                this.selectionEnd = { x, y };
            }
        } else {
            // 通常のクリック（選択など）
            this.handleSelection();
        }
    }
    
    handleRightClick(event) {
        // 右クリック: ツールキャンセル
        if (this.game.toolSystem) {
            this.game.toolSystem.cancelTool();
        }
    }
    
    handleSelection() {
        // レイキャストで選択
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 建物の選択
        const buildings = this.game.sceneManager.scene.getObjectByName('buildings');
        if (buildings) {
            const intersects = this.raycaster.intersectObjects(buildings.children, true);
            if (intersects.length > 0) {
                const selected = intersects[0].object;
                this.game.ui.selectBuilding(selected.userData.building);
            }
        }
        
        // 住民の選択
        const residents = this.game.sceneManager.scene.getObjectByName('residents');
        if (residents) {
            const intersects = this.raycaster.intersectObjects(residents.children, true);
            if (intersects.length > 0) {
                const selected = intersects[0].object;
                this.game.ui.selectResident(selected.userData.resident);
            }
        }
    }
    
    updateSelection() {
        // 範囲選択の視覚的更新
        if (this.game.ui) {
            this.game.ui.updateSelectionBox(
                this.selectionStart,
                this.selectionEnd
            );
        }
    }
    
    finishSelection() {
        this.isSelecting = false;
        
        // 範囲選択の完了処理
        if (this.game.toolSystem && this.game.toolSystem.currentTool) {
            const worldStart = this.screenToWorld(this.selectionStart.x, this.selectionStart.y);
            const worldEnd = this.screenToWorld(this.selectionEnd.x, this.selectionEnd.y);
            
            this.game.toolSystem.handleRangeSelection(worldStart, worldEnd);
        }
        
        // 選択ボックスをクリア
        if (this.game.ui) {
            this.game.ui.clearSelectionBox();
        }
    }
    
    update(deltaTime) {
        // キーボードによるカメラ移動
        const moveSpeed = this.cameraSpeed * deltaTime * 60;
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.cameraTarget.z -= moveSpeed * Math.cos(this.cameraRotation.theta);
            this.cameraTarget.x -= moveSpeed * Math.sin(this.cameraRotation.theta);
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.cameraTarget.z += moveSpeed * Math.cos(this.cameraRotation.theta);
            this.cameraTarget.x += moveSpeed * Math.sin(this.cameraRotation.theta);
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.cameraTarget.x -= moveSpeed * Math.cos(this.cameraRotation.theta);
            this.cameraTarget.z += moveSpeed * Math.sin(this.cameraRotation.theta);
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.cameraTarget.x += moveSpeed * Math.cos(this.cameraRotation.theta);
            this.cameraTarget.z -= moveSpeed * Math.sin(this.cameraRotation.theta);
        }
        
        // Q/E でカメラ回転
        if (this.keys['KeyQ']) {
            this.cameraRotation.theta += this.rotationSpeed * deltaTime * 60;
        }
        if (this.keys['KeyE']) {
            this.cameraRotation.theta -= this.rotationSpeed * deltaTime * 60;
        }
        
        // カメラ位置を更新
        this.updateCameraPosition();
    }
    
    updateCameraPosition() {
        // 球面座標系でカメラ位置を計算
        const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraRotation.theta) * Math.sin(this.cameraRotation.phi);
        const y = this.cameraTarget.y + this.cameraDistance * Math.cos(this.cameraRotation.phi);
        const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraRotation.theta) * Math.sin(this.cameraRotation.phi);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTarget);
    }
    
    updateMouseWorldPosition() {
        // マウス位置のワールド座標を計算
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // 地面との交点を計算
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycaster.ray.intersectPlane(plane, this.mouseWorldPos);
    }
    
    screenToWorld(screenX, screenY) {
        const rect = this.domElement.getBoundingClientRect();
        const x = ((screenX / rect.width) * 2 - 1);
        const y = -((screenY / rect.height) * 2 - 1);
        
        const vector = new THREE.Vector3(x, y, 0.5);
        vector.unproject(this.camera);
        
        const dir = vector.sub(this.camera.position).normalize();
        const distance = -this.camera.position.y / dir.y;
        const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
        
        return { x: pos.x, z: pos.z };
    }
    
    getMouseWorldPosition() {
        return this.mouseWorldPos.clone();
    }
    
    getCameraInfo() {
        return {
            position: this.camera.position.clone(),
            target: this.cameraTarget.clone(),
            distance: this.cameraDistance,
            rotation: { ...this.cameraRotation }
        };
    }
}