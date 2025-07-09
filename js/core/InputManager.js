// 入力管理クラス
export class InputManager {
    constructor(config) {
        this.config = config;
        this.domElement = null;
        this.listeners = new Map();
        
        // 入力状態
        this.mousePosition = { x: 0, y: 0 };
        this.mouseButtons = { left: false, middle: false, right: false };
        this.keys = new Map();
        this.touches = new Map();
        
        // タッチジェスチャー
        this.touchStartDistance = 0;
        this.touchStartAngle = 0;
        
        // イベントタイプ
        this.eventTypes = [
            'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'wheel',
            'keydown', 'keyup',
            'touchstart', 'touchmove', 'touchend', 'touchcancel'
        ];
    }

    init(domElement) {
        this.domElement = domElement;
        this.setupEventListeners();
        console.log('✅ InputManager 初期化完了');
    }

    setupEventListeners() {
        // マウスイベント
        this.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.domElement.addEventListener('click', (e) => this.onClick(e));
        this.domElement.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        this.domElement.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // キーボードイベント
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // タッチイベント
        this.domElement.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.domElement.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.domElement.addEventListener('touchend', (e) => this.onTouchEnd(e));
        this.domElement.addEventListener('touchcancel', (e) => this.onTouchCancel(e));
        
        // フォーカス/ブラー
        window.addEventListener('blur', () => this.onWindowBlur());
    }

    // イベントリスナーの登録
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(eventType, event) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => {
                callback(event);
            });
        }
    }

    // マウスイベントハンドラー
    onMouseDown(event) {
        this.updateMousePosition(event);
        this.updateMouseButtons(event, true);
        this.emit('mousedown', event);
    }

    onMouseUp(event) {
        this.updateMousePosition(event);
        this.updateMouseButtons(event, false);
        this.emit('mouseup', event);
    }

    onMouseMove(event) {
        this.updateMousePosition(event);
        this.emit('mousemove', event);
    }

    onClick(event) {
        this.updateMousePosition(event);
        this.emit('click', event);
    }

    onDoubleClick(event) {
        this.updateMousePosition(event);
        this.emit('dblclick', event);
    }

    onWheel(event) {
        event.preventDefault();
        this.emit('wheel', event);
    }

    updateMousePosition(event) {
        const rect = this.domElement.getBoundingClientRect();
        this.mousePosition.x = event.clientX - rect.left;
        this.mousePosition.y = event.clientY - rect.top;
    }

    updateMouseButtons(event, pressed) {
        switch (event.button) {
            case 0:
                this.mouseButtons.left = pressed;
                break;
            case 1:
                this.mouseButtons.middle = pressed;
                break;
            case 2:
                this.mouseButtons.right = pressed;
                break;
        }
    }

    // キーボードイベントハンドラー
    onKeyDown(event) {
        if (this.keys.has(event.code)) return; // リピート防止
        
        this.keys.set(event.code, true);
        this.emit('keydown', event);
    }

    onKeyUp(event) {
        this.keys.delete(event.code);
        this.emit('keyup', event);
    }

    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    // タッチイベントハンドラー
    onTouchStart(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now()
            });
        }
        
        // ピンチジェスチャーの初期化
        if (event.touches.length === 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            this.touchStartDistance = this.getTouchDistance(touch1, touch2);
            this.touchStartAngle = this.getTouchAngle(touch1, touch2);
        }
        
        this.emit('touchstart', this.createTouchEvent(event));
    }

    onTouchMove(event) {
        event.preventDefault();
        
        for (let i = 0; i < event.touches.length; i++) {
            const touch = event.touches[i];
            if (this.touches.has(touch.identifier)) {
                const touchData = this.touches.get(touch.identifier);
                touchData.x = touch.clientX;
                touchData.y = touch.clientY;
            }
        }
        
        this.emit('touchmove', this.createTouchEvent(event));
    }

    onTouchEnd(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
        }
        
        this.emit('touchend', this.createTouchEvent(event));
    }

    onTouchCancel(event) {
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            this.touches.delete(touch.identifier);
        }
        
        this.emit('touchcancel', this.createTouchEvent(event));
    }

    createTouchEvent(originalEvent) {
        const touches = Array.from(this.touches.values());
        
        // ジェスチャー検出
        let gesture = null;
        if (originalEvent.touches.length === 2) {
            const touch1 = originalEvent.touches[0];
            const touch2 = originalEvent.touches[1];
            const currentDistance = this.getTouchDistance(touch1, touch2);
            const currentAngle = this.getTouchAngle(touch1, touch2);
            
            gesture = {
                type: 'pinch',
                scale: currentDistance / this.touchStartDistance,
                rotation: currentAngle - this.touchStartAngle
            };
        } else if (originalEvent.touches.length === 1 && this.touches.size === 1) {
            const touch = touches[0];
            const deltaX = touch.x - touch.startX;
            const deltaY = touch.y - touch.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const duration = Date.now() - touch.startTime;
            
            if (distance < 10 && duration < 200) {
                gesture = { type: 'tap' };
            } else if (distance > 30) {
                gesture = {
                    type: 'pan',
                    deltaX: deltaX,
                    deltaY: deltaY
                };
            }
        }
        
        return {
            touches: touches,
            gesture: gesture,
            originalEvent: originalEvent
        };
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchAngle(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.atan2(dy, dx);
    }

    // ウィンドウフォーカス
    onWindowBlur() {
        // すべてのキーとマウスボタンの状態をリセット
        this.keys.clear();
        this.mouseButtons.left = false;
        this.mouseButtons.middle = false;
        this.mouseButtons.right = false;
    }

    // ユーティリティ
    getMousePosition() {
        return { ...this.mousePosition };
    }

    getNormalizedMousePosition() {
        const rect = this.domElement.getBoundingClientRect();
        return {
            x: (this.mousePosition.x / rect.width) * 2 - 1,
            y: -(this.mousePosition.y / rect.height) * 2 + 1
        };
    }

    isMouseButtonPressed(button) {
        switch (button) {
            case 'left':
                return this.mouseButtons.left;
            case 'middle':
                return this.mouseButtons.middle;
            case 'right':
                return this.mouseButtons.right;
            default:
                return false;
        }
    }

    dispose() {
        // すべてのイベントリスナーを削除
        this.eventTypes.forEach(type => {
            this.listeners.delete(type);
        });
    }
}