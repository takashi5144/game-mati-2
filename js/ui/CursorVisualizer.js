// カーソル視覚フィードバッククラス
import { THREE } from '../three-global.js';

export class CursorVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.cursorMesh = null;
        this.gridHelper = null;
        this.rangeIndicator = null;
        this.rangeStart = null;
        this.rangeEnd = null;
        
        this.init();
    }
    
    init() {
        // カーソル位置インジケーター
        const cursorGeometry = new THREE.RingGeometry(0.4, 0.5, 32);
        const cursorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
        this.cursorMesh.rotation.x = -Math.PI / 2;
        this.cursorMesh.visible = false;
        this.scene.add(this.cursorMesh);
        
        // グリッドヘルパー（建物配置時）
        const size = 3;
        const divisions = 3;
        this.gridHelper = new THREE.GridHelper(size, divisions, 0x00ff88, 0x00ff88);
        this.gridHelper.material.opacity = 0.3;
        this.gridHelper.material.transparent = true;
        this.gridHelper.visible = false;
        this.scene.add(this.gridHelper);
        
        // 範囲選択インジケーター
        this.createRangeIndicator();
    }
    
    createRangeIndicator() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        this.rangeIndicator = new THREE.Mesh(geometry, material);
        this.rangeIndicator.rotation.x = -Math.PI / 2;
        this.rangeIndicator.position.y = 0.1;
        this.rangeIndicator.visible = false;
        this.scene.add(this.rangeIndicator);
        
        // 範囲選択の枠線
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.rangeIndicator.add(edges);
    }
    
    updateCursorPosition(worldPos) {
        if (!worldPos) return;
        
        this.cursorMesh.position.x = worldPos.x;
        this.cursorMesh.position.y = 0.1;
        this.cursorMesh.position.z = worldPos.z;
        
        // パルスアニメーション
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
        this.cursorMesh.scale.set(scale, scale, scale);
    }
    
    showCursor(show = true) {
        this.cursorMesh.visible = show;
    }
    
    updateGridPosition(worldPos) {
        if (!worldPos) return;
        
        const gridX = Math.floor(worldPos.x) + 0.5;
        const gridZ = Math.floor(worldPos.z) + 0.5;
        
        this.gridHelper.position.x = gridX;
        this.gridHelper.position.y = 0.05;
        this.gridHelper.position.z = gridZ;
    }
    
    showGrid(show = true) {
        this.gridHelper.visible = show;
    }
    
    setGridValid(valid) {
        const color = valid ? 0x00ff88 : 0xff0000;
        this.gridHelper.material.color.setHex(color);
    }
    
    startRangeSelection(worldPos) {
        this.rangeStart = { x: worldPos.x, z: worldPos.z };
        this.rangeEnd = { x: worldPos.x, z: worldPos.z };
        this.rangeIndicator.visible = true;
        this.updateRangeIndicator();
    }
    
    updateRangeSelection(worldPos) {
        if (!this.rangeStart) return;
        
        this.rangeEnd = { x: worldPos.x, z: worldPos.z };
        this.updateRangeIndicator();
    }
    
    endRangeSelection() {
        this.rangeIndicator.visible = false;
        this.rangeStart = null;
        this.rangeEnd = null;
    }
    
    updateRangeIndicator() {
        if (!this.rangeStart || !this.rangeEnd) return;
        
        const minX = Math.min(this.rangeStart.x, this.rangeEnd.x);
        const maxX = Math.max(this.rangeStart.x, this.rangeEnd.x);
        const minZ = Math.min(this.rangeStart.z, this.rangeEnd.z);
        const maxZ = Math.max(this.rangeStart.z, this.rangeEnd.z);
        
        const width = maxX - minX;
        const height = maxZ - minZ;
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // サイズが小さすぎる場合は最小サイズを設定
        const finalWidth = Math.max(width, 0.1);
        const finalHeight = Math.max(height, 0.1);
        
        this.rangeIndicator.position.x = centerX;
        this.rangeIndicator.position.z = centerZ;
        this.rangeIndicator.scale.x = finalWidth;
        this.rangeIndicator.scale.z = finalHeight;
        
        // エッジの更新
        const child = this.rangeIndicator.children[0];
        if (child) {
            this.rangeIndicator.remove(child);
            child.geometry.dispose();
        }
        
        const geometry = new THREE.PlaneGeometry(1, 1);
        const edgeGeometry = new THREE.EdgesGeometry(geometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            linewidth: 2
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        this.rangeIndicator.add(edges);
    }
    
    setRangeColor(color) {
        this.rangeIndicator.material.color.setHex(color);
        if (this.rangeIndicator.children[0]) {
            this.rangeIndicator.children[0].material.color.setHex(color);
        }
    }
    
    showBuildingPreview(buildingType, worldPos, valid = true) {
        // 建物プレビューの表示（ToolSystemで実装済み）
        this.showGrid(true);
        this.setGridValid(valid);
        this.updateGridPosition(worldPos);
    }
    
    hideBuildingPreview() {
        this.showGrid(false);
    }
    
    dispose() {
        if (this.cursorMesh) {
            this.cursorMesh.geometry.dispose();
            this.cursorMesh.material.dispose();
            this.scene.remove(this.cursorMesh);
        }
        
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }
        
        if (this.rangeIndicator) {
            this.rangeIndicator.geometry.dispose();
            this.rangeIndicator.material.dispose();
            this.scene.remove(this.rangeIndicator);
        }
    }
}