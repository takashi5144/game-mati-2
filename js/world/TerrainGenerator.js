// 地形生成クラス
import { THREE } from '../three-global.js';

export class TerrainGenerator {
    constructor(config, scene) {
        this.config = config;
        this.scene = scene;
        this.terrain = null;
        this.tiles = new Map();
        this.heightMap = [];
        this.biomeMap = [];
    }

    async generate() {
        console.log('🌍 地形生成開始...');
        
        // ハイトマップの生成
        this.generateHeightMap();
        
        // バイオームマップの生成
        this.generateBiomeMap();
        
        // 地形メッシュの作成
        this.createTerrainMesh();
        
        // タイルの作成
        this.createTiles();
        
        // 植生の配置
        this.placeVegetation();
        
        console.log('✅ 地形生成完了');
    }

    generateHeightMap() {
        const size = this.config.SIZE;
        this.heightMap = [];
        
        // シンプルなパーリンノイズ風の高さマップ
        for (let z = 0; z < size; z++) {
            this.heightMap[z] = [];
            for (let x = 0; x < size; x++) {
                // 複数の周波数を組み合わせて自然な地形を生成
                let height = 0;
                let amplitude = 1;
                let frequency = 0.02;
                
                for (let i = 0; i < 4; i++) {
                    height += this.noise2D(x * frequency, z * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2;
                }
                
                // 中心からの距離に基づいて高さを調整（島のような形状）
                const centerX = size / 2;
                const centerZ = size / 2;
                const distance = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2)
                ) / (size / 2);
                
                height *= Math.max(0, 1 - distance * 0.7);
                height *= this.config.HEIGHT_VARIATION;
                
                this.heightMap[z][x] = height;
            }
        }
    }

    generateBiomeMap() {
        const size = this.config.SIZE;
        this.biomeMap = [];
        
        for (let z = 0; z < size; z++) {
            this.biomeMap[z] = [];
            for (let x = 0; x < size; x++) {
                const height = this.heightMap[z][x];
                const moisture = this.noise2D(x * 0.03 + 100, z * 0.03 + 100);
                
                // 高さと湿度に基づいてバイオームを決定
                let biome;
                if (height < -1) {
                    biome = 'WATER';
                } else if (height > 3) {
                    biome = 'HILLS';
                } else if (moisture > 0.3) {
                    biome = 'FOREST';
                } else {
                    biome = 'PLAINS';
                }
                
                this.biomeMap[z][x] = biome;
            }
        }
    }

    createTerrainMesh() {
        const size = this.config.SIZE;
        const segments = size - 1;
        
        // 地形ジオメトリの作成
        const geometry = new THREE.PlaneGeometry(
            size * this.config.TILE_SIZE,
            size * this.config.TILE_SIZE,
            segments,
            segments
        );
        
        // 頂点の高さを設定
        const vertices = geometry.attributes.position.array;
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const index = (z * size + x) * 3;
                vertices[index + 2] = this.heightMap[z][x]; // Y座標（Three.jsではZが上）
            }
        }
        
        // 法線の再計算
        geometry.computeVertexNormals();
        
        // マテリアルの作成
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.0
        });
        
        // 頂点カラーの設定
        const colors = new Float32Array(vertices.length);
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const index = (z * size + x) * 3;
                const biome = this.biomeMap[z][x];
                const biomeConfig = this.config.BIOMES[biome];
                const color = new THREE.Color(biomeConfig.color);
                
                // 高さに基づいて色を少し変化させる
                const height = this.heightMap[z][x];
                const brightness = 0.8 + height * 0.02;
                color.multiplyScalar(brightness);
                
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // メッシュの作成
        this.terrain = new THREE.Mesh(geometry, material);
        this.terrain.rotation.x = -Math.PI / 2; // 水平に配置
        this.terrain.position.set(size / 2, 0, size / 2);
        this.terrain.receiveShadow = true;
        this.terrain.castShadow = false;
        this.terrain.userData.type = 'terrain';
        
        this.scene.add(this.terrain);
    }

    createTiles() {
        const size = this.config.SIZE;
        
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const tile = {
                    x: x,
                    z: z,
                    height: this.heightMap[z][x],
                    biome: this.biomeMap[z][x],
                    occupied: false,
                    building: null,
                    resources: []
                };
                
                const key = `${x},${z}`;
                this.tiles.set(key, tile);
            }
        }
    }

    placeVegetation() {
        const size = this.config.SIZE;
        const treeGroup = new THREE.Group();
        treeGroup.name = 'vegetation';
        
        for (let z = 0; z < size; z += 2) {
            for (let x = 0; x < size; x += 2) {
                const tile = this.getTile(x, z);
                if (!tile) continue;
                
                // 森林バイオームに木を配置
                if (tile.biome === 'FOREST' && Math.random() > 0.3) {
                    const tree = this.createTree();
                    tree.position.set(
                        x + (Math.random() - 0.5),
                        tile.height,
                        z + (Math.random() - 0.5)
                    );
                    tree.userData.tileX = x;
                    tree.userData.tileZ = z;
                    tree.userData.type = 'tree';
                    treeGroup.add(tree);
                    
                    tile.resources.push({ type: 'wood', amount: 5 });
                }
                // 平原に草や花を配置
                else if (tile.biome === 'PLAINS' && Math.random() > 0.7) {
                    const grass = this.createGrass();
                    grass.position.set(
                        x + (Math.random() - 0.5),
                        tile.height,
                        z + (Math.random() - 0.5)
                    );
                    treeGroup.add(grass);
                }
            }
        }
        
        this.scene.add(treeGroup);
    }

    createTree() {
        const tree = new THREE.Group();
        
        // 幹
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A3C28,
            roughness: 0.8
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);
        
        // 葉
        const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 6);
        const leavesMaterial = new THREE.MeshStandardMaterial({
            color: 0x2D5016,
            roughness: 0.8
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 3;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
        
        // ランダムなサイズと回転
        const scale = 0.8 + Math.random() * 0.4;
        tree.scale.set(scale, scale, scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        return tree;
    }

    createGrass() {
        const grassGeometry = new THREE.ConeGeometry(0.05, 0.3, 4);
        const grassMaterial = new THREE.MeshStandardMaterial({
            color: 0x3A7D44,
            roughness: 0.9
        });
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.position.y = 0.15;
        
        return grass;
    }

    // ユーティリティメソッド
    getTile(x, z) {
        const key = `${Math.floor(x)},${Math.floor(z)}`;
        return this.tiles.get(key);
    }

    getHeight(x, z) {
        const tile = this.getTile(x, z);
        return tile ? tile.height : 0;
    }

    isWalkable(x, z) {
        const tile = this.getTile(x, z);
        return tile && tile.biome !== 'WATER' && !tile.occupied;
    }

    // シンプルなノイズ関数（実際のパーリンノイズの簡易版）
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
    }

    // 地形の更新
    updateTile(x, z, data) {
        const tile = this.getTile(x, z);
        if (tile) {
            Object.assign(tile, data);
        }
    }

    // 特定の範囲のタイルを取得
    getTilesInRadius(centerX, centerZ, radius) {
        const tiles = [];
        const minX = Math.max(0, Math.floor(centerX - radius));
        const maxX = Math.min(this.config.SIZE - 1, Math.ceil(centerX + radius));
        const minZ = Math.max(0, Math.floor(centerZ - radius));
        const maxZ = Math.min(this.config.SIZE - 1, Math.ceil(centerZ + radius));
        
        for (let z = minZ; z <= maxZ; z++) {
            for (let x = minX; x <= maxX; x++) {
                const dx = x - centerX;
                const dz = z - centerZ;
                if (dx * dx + dz * dz <= radius * radius) {
                    const tile = this.getTile(x, z);
                    if (tile) tiles.push(tile);
                }
            }
        }
        
        return tiles;
    }
}