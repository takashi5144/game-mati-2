// レンダラー管理クラス
import { THREE } from '../three-global.js';

export class Renderer {
    constructor(config) {
        this.config = config;
        this.renderer = null;
        this.camera = null;
        this.domElement = null;
        this.stats = null;
    }

    init() {
        // WebGLレンダラーの作成
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.renderer.antialias,
            alpha: this.config.renderer.alpha,
            powerPreference: this.config.renderer.powerPreference
        });

        // レンダラーの設定
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // シャドウマップの設定
        if (this.config.renderer.shadowMap.enabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = this.config.renderer.shadowMap.type;
            this.renderer.shadowMap.autoUpdate = this.config.renderer.shadowMap.autoUpdate;
        }

        // トーンマッピング
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // DOM要素の設定
        this.domElement = this.renderer.domElement;
        const container = document.getElementById('game-container');
        container.appendChild(this.domElement);

        // カメラの作成
        this.createCamera();

        console.log('✅ Renderer 初期化完了');
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            this.config.camera.fov,
            window.innerWidth / window.innerHeight,
            this.config.camera.near,
            this.config.camera.far
        );

        this.camera.position.set(
            this.config.camera.position.x,
            this.config.camera.position.y,
            this.config.camera.position.z
        );

        this.camera.lookAt(
            this.config.camera.lookAt.x,
            this.config.camera.lookAt.y,
            this.config.camera.lookAt.z
        );
    }

    render(scene, camera) {
        this.renderer.render(scene, camera || this.camera);
    }

    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    // ポストプロセッシングの設定（将来の拡張用）
    setupPostProcessing() {
        // TODO: Bloom、SSAO、被写界深度などの実装
    }

    dispose() {
        this.renderer.dispose();
        this.domElement.remove();
    }
}