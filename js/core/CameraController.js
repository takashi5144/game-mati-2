// カメラコントローラークラス
export class CameraController {
    constructor(camera, domElement, config) {
        this.camera = camera;
        this.domElement = domElement;
        this.config = config;
        
        // カメラの状態
        this.target = new THREE.Vector3(0, 0, 0);
        this.spherical = new THREE.Spherical();
        this.sphericalDelta = new THREE.Spherical();
        
        // マウス状態
        this.isRotating = false;
        this.isPanning = false;
        this.isDragging = false;
        
        this.rotateStart = new THREE.Vector2();
        this.rotateEnd = new THREE.Vector2();
        this.rotateDelta = new THREE.Vector2();
        
        this.panStart = new THREE.Vector2();
        this.panEnd = new THREE.Vector2();
        this.panDelta = new THREE.Vector2();
        
        // カメラ制限
        this.minDistance = 10;
        this.maxDistance = 100;
        this.minPolarAngle = 0.1;
        this.maxPolarAngle = Math.PI * 0.495;
        
        // 移動速度
        this.panSpeed = 1.0;
        this.rotateSpeed = 1.0;
        this.zoomSpeed = 1.0;
        this.keyboardMoveSpeed = 50;
        
        // キーボード状態
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            rotateLeft: false,
            rotateRight: false
        };
        
        this.init();
    }

    init() {
        // 初期カメラ位置から球面座標を計算
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        this.spherical.setFromVector3(offset);
        
        // イベントリスナーの設定
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseDown(event) {
        switch (event.button) {
            case 0: // 左ボタン
                this.isDragging = true;
                break;
            case 1: // 中ボタン
                this.isPanning = true;
                this.panStart.set(event.clientX, event.clientY);
                this.domElement.classList.add('panning');
                break;
            case 2: // 右ボタン
                this.isRotating = true;
                this.rotateStart.set(event.clientX, event.clientY);
                this.domElement.classList.add('rotating');
                break;
        }
    }

    onMouseUp(event) {
        switch (event.button) {
            case 0: // 左ボタン
                this.isDragging = false;
                break;
            case 1: // 中ボタン
                this.isPanning = false;
                this.domElement.classList.remove('panning');
                break;
            case 2: // 右ボタン
                this.isRotating = false;
                this.domElement.classList.remove('rotating');
                break;
        }
    }

    onMouseMove(event) {
        if (this.isRotating) {
            this.rotateEnd.set(event.clientX, event.clientY);
            this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
            
            const element = this.domElement;
            this.rotateLeft(2 * Math.PI * this.rotateDelta.x / element.clientWidth * this.config.SENSITIVITY.rotate);
            this.rotateUp(2 * Math.PI * this.rotateDelta.y / element.clientHeight * this.config.SENSITIVITY.rotate);
            
            this.rotateStart.copy(this.rotateEnd);
        }
        
        if (this.isPanning) {
            this.panEnd.set(event.clientX, event.clientY);
            this.panDelta.subVectors(this.panEnd, this.panStart);
            
            this.pan(this.panDelta.x * this.config.SENSITIVITY.pan, this.panDelta.y * this.config.SENSITIVITY.pan);
            
            this.panStart.copy(this.panEnd);
        }
    }

    onMouseWheel(event) {
        event.preventDefault();
        
        if (event.deltaY < 0) {
            this.zoomIn();
        } else {
            this.zoomOut();
        }
    }

    handleKeyboard(action) {
        switch (action) {
            case 'camera_forward':
                this.keys.forward = true;
                break;
            case 'camera_backward':
                this.keys.backward = true;
                break;
            case 'camera_left':
                this.keys.left = true;
                break;
            case 'camera_right':
                this.keys.right = true;
                break;
            case 'camera_rotate_left':
                this.rotateLeft(Math.PI / 8);
                break;
            case 'camera_rotate_right':
                this.rotateLeft(-Math.PI / 8);
                break;
            case 'camera_zoom_in':
                this.zoomIn();
                break;
            case 'camera_zoom_out':
                this.zoomOut();
                break;
        }
    }

    rotateLeft(angle) {
        this.sphericalDelta.theta -= angle;
    }

    rotateUp(angle) {
        this.sphericalDelta.phi -= angle;
    }

    pan(deltaX, deltaY) {
        const offset = new THREE.Vector3();
        const distance = this.camera.position.distanceTo(this.target);
        
        // スクリーン空間でのパン量を計算
        let targetDistance = distance * Math.tan((this.camera.fov / 2) * Math.PI / 180.0);
        
        // 横方向の移動
        const panLeft = new THREE.Vector3();
        panLeft.setFromMatrixColumn(this.camera.matrix, 0); // カメラのX軸
        panLeft.multiplyScalar(-2 * deltaX * targetDistance / this.domElement.clientHeight);
        
        // 縦方向の移動（Y軸固定）
        const panUp = new THREE.Vector3(0, 1, 0);
        panUp.multiplyScalar(2 * deltaY * targetDistance / this.domElement.clientHeight);
        
        offset.add(panLeft);
        offset.add(panUp);
        
        this.target.add(offset);
    }

    zoomIn() {
        this.spherical.radius *= 0.9;
    }

    zoomOut() {
        this.spherical.radius *= 1.1;
    }

    update(deltaTime) {
        // キーボード移動
        if (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right) {
            const moveVector = new THREE.Vector3();
            
            // カメラの向きに基づいて移動方向を計算
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            
            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
            
            if (this.keys.forward) moveVector.add(forward);
            if (this.keys.backward) moveVector.sub(forward);
            if (this.keys.right) moveVector.add(right);
            if (this.keys.left) moveVector.sub(right);
            
            moveVector.normalize();
            moveVector.multiplyScalar(this.keyboardMoveSpeed * deltaTime);
            
            this.target.add(moveVector);
        }
        
        // 球面座標の更新
        this.spherical.theta += this.sphericalDelta.theta;
        this.spherical.phi += this.sphericalDelta.phi;
        
        // 制限の適用
        this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
        this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
        
        // カメラ位置の計算
        const offset = new THREE.Vector3();
        offset.setFromSpherical(this.spherical);
        
        this.camera.position.copy(this.target).add(offset);
        this.camera.lookAt(this.target);
        
        // デルタのリセット
        this.sphericalDelta.set(0, 0, 0);
        
        // キーの状態をリセット（一度だけの動作のため）
        this.keys.forward = false;
        this.keys.backward = false;
        this.keys.left = false;
        this.keys.right = false;
    }

    onWindowResize() {
        // ウィンドウリサイズ時の処理
    }

    setTarget(position) {
        this.target.copy(position);
    }

    getTarget() {
        return this.target.clone();
    }

    reset() {
        this.target.set(0, 0, 0);
        this.camera.position.set(30, 30, 30);
        this.camera.lookAt(this.target);
        
        const offset = new THREE.Vector3().subVectors(this.camera.position, this.target);
        this.spherical.setFromVector3(offset);
    }
}