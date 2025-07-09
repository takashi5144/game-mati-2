// 建設エフェクトシステム
import { THREE } from '../three-global.js';

export class ConstructionEffects {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = [];
        this.particleSystems = new Map();
        this.scaffoldingGroup = new THREE.Group();
        this.scaffoldingGroup.name = 'scaffolding';
        this.scene.add(this.scaffoldingGroup);
    }
    
    // 建設開始エフェクト
    startConstruction(building) {
        const effect = {
            buildingId: building.id,
            building: building,
            scaffolding: this.createScaffolding(building),
            particles: this.createConstructionParticles(building),
            workers: [],
            sounds: [],
            startTime: Date.now()
        };
        
        this.activeEffects.push(effect);
        
        // 建設サイトマーカーを作成
        this.createConstructionSite(building);
        
        return effect;
    }
    
    // 足場を作成
    createScaffolding(building) {
        const group = new THREE.Group();
        const config = building.config;
        const width = config.size?.width || 2;
        const height = config.size?.height || 3;
        const depth = config.size?.width || config.size?.depth || 2;
        
        // 木材の色
        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        
        // 縦の支柱
        const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, height + 1);
        const positions = [
            [-width/2, -depth/2],
            [width/2, -depth/2],
            [width/2, depth/2],
            [-width/2, depth/2]
        ];
        
        positions.forEach(([x, z]) => {
            const pole = new THREE.Mesh(poleGeometry, woodMaterial);
            pole.position.set(x, height/2, z);
            pole.castShadow = true;
            group.add(pole);
        });
        
        // 横の梁
        const beamGeometry = new THREE.BoxGeometry(0.1, 0.1, width);
        const levels = Math.ceil(height / 1.5);
        
        for (let level = 0; level < levels; level++) {
            const y = (level + 1) * (height / levels);
            
            // 前後の梁
            [-depth/2, depth/2].forEach(z => {
                const beam = new THREE.Mesh(beamGeometry, woodMaterial);
                beam.position.set(0, y, z);
                beam.rotation.y = Math.PI / 2;
                beam.castShadow = true;
                group.add(beam);
            });
            
            // 左右の梁
            const sideBeamGeometry = new THREE.BoxGeometry(0.1, 0.1, depth);
            [-width/2, width/2].forEach(x => {
                const beam = new THREE.Mesh(sideBeamGeometry, woodMaterial);
                beam.position.set(x, y, 0);
                beam.castShadow = true;
                group.add(beam);
            });
        }
        
        // 作業用プラットフォーム
        const platformGeometry = new THREE.BoxGeometry(width * 0.8, 0.1, depth * 0.8);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9
        });
        
        for (let level = 1; level < levels; level++) {
            const platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.y = level * (height / levels) - 0.1;
            platform.receiveShadow = true;
            group.add(platform);
        }
        
        // はしご
        const ladderGroup = this.createLadder(height);
        ladderGroup.position.set(-width/2 - 0.2, 0, 0);
        group.add(ladderGroup);
        
        group.position.set(building.x, 0, building.z);
        this.scaffoldingGroup.add(group);
        
        return group;
    }
    
    // はしごを作成
    createLadder(height) {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({
            color: 0x654321,
            roughness: 0.9
        });
        
        // 縦の支柱
        const sideGeometry = new THREE.CylinderGeometry(0.02, 0.02, height);
        [-0.15, 0.15].forEach(x => {
            const side = new THREE.Mesh(sideGeometry, material);
            side.position.set(x, height/2, 0);
            group.add(side);
        });
        
        // 横の段
        const stepGeometry = new THREE.BoxGeometry(0.35, 0.03, 0.05);
        const steps = Math.floor(height / 0.3);
        
        for (let i = 0; i < steps; i++) {
            const step = new THREE.Mesh(stepGeometry, material);
            step.position.y = (i + 1) * 0.3;
            group.add(step);
        }
        
        return group;
    }
    
    // 建設現場のマーカー
    createConstructionSite(building) {
        const group = new THREE.Group();
        
        // 地面のマーカー
        const markerGeometry = new THREE.PlaneGeometry(
            building.config.size?.width + 1 || 3,
            building.config.size?.width + 1 || 3
        );
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.rotation.x = -Math.PI / 2;
        marker.position.y = 0.01;
        group.add(marker);
        
        // 建設資材（箱）
        const cratePositions = [
            { x: -2, z: -2 },
            { x: 2, z: -2 },
            { x: -1, z: 2 }
        ];
        
        cratePositions.forEach(pos => {
            const crate = this.createCrate();
            crate.position.set(pos.x, 0.25, pos.z);
            crate.rotation.y = Math.random() * Math.PI;
            group.add(crate);
        });
        
        group.position.set(building.x, 0, building.z);
        this.scene.add(group);
        building.constructionSite = group;
    }
    
    // 資材箱を作成
    createCrate() {
        const group = new THREE.Group();
        const boxGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const boxMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.castShadow = true;
        box.receiveShadow = true;
        group.add(box);
        
        // 縁の装飾
        const edgeGeometry = new THREE.BoxGeometry(0.52, 0.05, 0.52);
        const edgeMaterial = new THREE.MeshStandardMaterial({
            color: 0x654321
        });
        const topEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        topEdge.position.y = 0.25;
        group.add(topEdge);
        
        return group;
    }
    
    // 建設パーティクルを作成
    createConstructionParticles(building) {
        const particleSystem = {
            particles: [],
            emitters: []
        };
        
        // ダストパーティクル
        const dustEmitter = {
            position: new THREE.Vector3(building.x, 0, building.z),
            rate: 2,
            lifetime: 3,
            speed: 0.5,
            size: 0.1,
            color: 0xCCCCCC,
            spread: building.config.size?.width || 2
        };
        
        particleSystem.emitters.push(dustEmitter);
        this.particleSystems.set(building.id, particleSystem);
        
        return particleSystem;
    }
    
    // 作業者がアニメーション
    animateWorker(worker, building, deltaTime) {
        if (!worker.constructionAnimation) {
            worker.constructionAnimation = {
                action: 'hammering',
                timer: 0,
                position: {
                    x: building.x + (Math.random() - 0.5) * 2,
                    z: building.z + (Math.random() - 0.5) * 2
                }
            };
        }
        
        const anim = worker.constructionAnimation;
        anim.timer += deltaTime;
        
        switch (anim.action) {
            case 'hammering':
                // ハンマーを振る動作
                if (worker.mesh) {
                    const hammerSpeed = 3;
                    const hammerAngle = Math.sin(anim.timer * hammerSpeed) * 0.5;
                    worker.mesh.rotation.x = hammerAngle;
                    
                    // 音を出すタイミング
                    if (Math.sin(anim.timer * hammerSpeed) > 0.9 && 
                        Math.sin((anim.timer - deltaTime) * hammerSpeed) <= 0.9) {
                        this.playHammerSound(worker.position);
                    }
                }
                
                // たまに位置を変える
                if (anim.timer > 5) {
                    anim.timer = 0;
                    anim.position = {
                        x: building.x + (Math.random() - 0.5) * 2,
                        z: building.z + (Math.random() - 0.5) * 2
                    };
                    anim.action = Math.random() > 0.5 ? 'carrying' : 'hammering';
                }
                break;
                
            case 'carrying':
                // 資材を運ぶ動作
                if (worker.mesh) {
                    // 歩行アニメーション
                    const walkCycle = Math.sin(anim.timer * 4) * 0.1;
                    worker.mesh.position.y = Math.abs(walkCycle);
                }
                
                if (anim.timer > 3) {
                    anim.timer = 0;
                    anim.action = 'hammering';
                }
                break;
        }
    }
    
    // ハンマー音（視覚的フィードバック）
    playHammerSound(position) {
        // 音波エフェクト
        const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y += 1;
        ring.rotation.x = -Math.PI / 2;
        this.scene.add(ring);
        
        // アニメーション
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed < 0.5) {
                ring.scale.setScalar(1 + elapsed * 2);
                ring.material.opacity = 0.5 - elapsed;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ring.geometry.dispose();
                ring.material.dispose();
            }
        };
        animate();
    }
    
    // 建設進捗の更新
    updateConstruction(building, progress) {
        const effect = this.activeEffects.find(e => e.buildingId === building.id);
        if (!effect) return;
        
        // 建物の高さをアニメーション
        if (building.mesh) {
            const targetHeight = (building.config.size?.height || 3) * progress;
            building.mesh.scale.y = progress;
            building.mesh.position.y = targetHeight / 2;
            
            // 一定の進捗ごとに煙エフェクト
            const progressSteps = Math.floor(progress * 10);
            if (progressSteps > (building.lastProgressStep || 0)) {
                this.createProgressSmoke(building);
                building.lastProgressStep = progressSteps;
            }
        }
        
        // 足場の段階的な構築/解体
        if (effect.scaffolding) {
            const scaffoldingProgress = progress < 0.8 ? 1 : (1 - progress) * 5;
            effect.scaffolding.scale.y = Math.max(0.1, scaffoldingProgress);
        }
    }
    
    // 進捗時の煙エフェクト
    createProgressSmoke(building) {
        const smokeCount = 5;
        const particles = [];
        
        for (let i = 0; i < smokeCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2);
            const material = new THREE.MeshBasicMaterial({
                color: 0xCCCCCC,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.set(
                building.x + (Math.random() - 0.5) * 2,
                0.5,
                building.z + (Math.random() - 0.5) * 2
            );
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                1 + Math.random(),
                (Math.random() - 0.5) * 0.5
            );
            
            particles.push(particle);
            this.scene.add(particle);
        }
        
        // パーティクルアニメーション
        const animateParticles = () => {
            let allDone = true;
            
            particles.forEach(particle => {
                if (particle.material.opacity > 0) {
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.02));
                    particle.velocity.y -= 0.01;
                    particle.scale.multiplyScalar(1.02);
                    particle.material.opacity -= 0.01;
                    allDone = false;
                } else {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            }
        };
        animateParticles();
    }
    
    // 建設完了エフェクト
    completeConstruction(building) {
        const effect = this.activeEffects.find(e => e.buildingId === building.id);
        if (!effect) return;
        
        // 足場を撤去
        if (effect.scaffolding) {
            // 落下アニメーション
            const fallDuration = 1000;
            const startTime = Date.now();
            const startY = effect.scaffolding.position.y;
            
            const animateFall = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / fallDuration, 1);
                
                effect.scaffolding.position.y = startY - progress * 2;
                effect.scaffolding.rotation.z = progress * 0.3;
                effect.scaffolding.scale.setScalar(1 - progress * 0.3);
                
                if (progress < 1) {
                    requestAnimationFrame(animateFall);
                } else {
                    this.scaffoldingGroup.remove(effect.scaffolding);
                    
                    // 煙エフェクト
                    this.createCompletionSmoke(building);
                }
            };
            animateFall();
        }
        
        // 建設現場を撤去
        if (building.constructionSite) {
            this.scene.remove(building.constructionSite);
            building.constructionSite = null;
        }
        
        // 完了の光エフェクト
        this.createCompletionGlow(building);
        
        // エフェクトをリストから削除
        const index = this.activeEffects.indexOf(effect);
        if (index > -1) {
            this.activeEffects.splice(index, 1);
        }
    }
    
    // 完成時の光エフェクト
    createCompletionGlow(building) {
        const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,
            transparent: true,
            opacity: 0.5
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(building.x, 2, building.z);
        this.scene.add(glow);
        
        // 光の拡大とフェードアウト
        const animateGlow = () => {
            glow.scale.multiplyScalar(1.05);
            glow.material.opacity *= 0.95;
            
            if (glow.material.opacity > 0.01) {
                requestAnimationFrame(animateGlow);
            } else {
                this.scene.remove(glow);
                glow.geometry.dispose();
                glow.material.dispose();
            }
        };
        animateGlow();
    }
    
    // 完成時の煙エフェクト
    createCompletionSmoke(building) {
        const smokeRingCount = 20;
        const particles = [];
        
        for (let i = 0; i < smokeRingCount; i++) {
            const angle = (i / smokeRingCount) * Math.PI * 2;
            const radius = 2;
            
            const geometry = new THREE.SphereGeometry(0.3);
            const material = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.set(
                building.x + Math.cos(angle) * radius,
                0.5,
                building.z + Math.sin(angle) * radius
            );
            
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * 0.5,
                2,
                Math.sin(angle) * 0.5
            );
            
            particles.push(particle);
            this.scene.add(particle);
        }
        
        // アニメーション
        const animateParticles = () => {
            let allDone = true;
            
            particles.forEach(particle => {
                if (particle.material.opacity > 0) {
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.03));
                    particle.velocity.y *= 0.98;
                    particle.scale.multiplyScalar(1.01);
                    particle.material.opacity -= 0.02;
                    allDone = false;
                } else {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            });
            
            if (!allDone) {
                requestAnimationFrame(animateParticles);
            }
        };
        animateParticles();
    }
    
    // 更新処理
    update(deltaTime) {
        // アクティブな建設エフェクトを更新
        this.activeEffects.forEach(effect => {
            // パーティクルの更新
            if (effect.particles && effect.particles.emitters) {
                effect.particles.emitters.forEach(emitter => {
                    this.updateParticleEmitter(emitter, deltaTime);
                });
            }
            
            // 作業者のアニメーション
            if (effect.building.workers) {
                effect.building.workers.forEach(workerId => {
                    const worker = this.game?.residentSystem?.getResident(workerId);
                    if (worker) {
                        this.animateWorker(worker, effect.building, deltaTime);
                    }
                });
            }
        });
    }
    
    // パーティクルエミッターの更新
    updateParticleEmitter(emitter, deltaTime) {
        emitter.timer = (emitter.timer || 0) + deltaTime;
        
        if (emitter.timer > 1 / emitter.rate) {
            emitter.timer = 0;
            
            // 新しいパーティクルを生成
            const geometry = new THREE.SphereGeometry(emitter.size);
            const material = new THREE.MeshBasicMaterial({
                color: emitter.color,
                transparent: true,
                opacity: 0.7
            });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(emitter.position);
            particle.position.x += (Math.random() - 0.5) * emitter.spread;
            particle.position.z += (Math.random() - 0.5) * emitter.spread;
            
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * emitter.speed,
                Math.random() * emitter.speed * 2,
                (Math.random() - 0.5) * emitter.speed
            );
            
            particle.lifetime = emitter.lifetime;
            particle.age = 0;
            
            this.scene.add(particle);
            
            // パーティクルの更新
            const updateParticle = () => {
                particle.age += 0.016;
                
                if (particle.age < particle.lifetime) {
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                    particle.velocity.y -= 0.01;
                    
                    const lifeRatio = particle.age / particle.lifetime;
                    particle.material.opacity = 0.7 * (1 - lifeRatio);
                    particle.scale.setScalar(1 + lifeRatio * 0.5);
                    
                    requestAnimationFrame(updateParticle);
                } else {
                    this.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            };
            updateParticle();
        }
    }
}