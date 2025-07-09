// 天候システム
export class WeatherSystem {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.currentWeather = 'sunny';
        this.nextWeather = 'sunny';
        this.transitionProgress = 1.0;
        this.transitionDuration = 30; // 30秒で天候が変化
        
        // 天候エフェクト
        this.rainParticles = null;
        this.snowParticles = null;
        this.fogObject = null;
        this.cloudMeshes = [];
        this.lightningEffect = null;
        
        // 天候設定
        this.weatherTypes = {
            sunny: {
                name: '晴れ',
                icon: '☀️',
                fogDensity: 0.001,
                fogColor: 0x87CEEB,
                sunIntensity: 1.0,
                ambientIntensity: 0.4,
                windSpeed: 0.5,
                rainIntensity: 0,
                snowIntensity: 0,
                cloudCoverage: 0.1
            },
            cloudy: {
                name: '曇り',
                icon: '☁️',
                fogDensity: 0.003,
                fogColor: 0xCCCCCC,
                sunIntensity: 0.6,
                ambientIntensity: 0.5,
                windSpeed: 1.0,
                rainIntensity: 0,
                snowIntensity: 0,
                cloudCoverage: 0.7
            },
            rainy: {
                name: '雨',
                icon: '🌧️',
                fogDensity: 0.005,
                fogColor: 0x808080,
                sunIntensity: 0.3,
                ambientIntensity: 0.3,
                windSpeed: 2.0,
                rainIntensity: 1.0,
                snowIntensity: 0,
                cloudCoverage: 0.9
            },
            foggy: {
                name: '霧',
                icon: '🌫️',
                fogDensity: 0.02,
                fogColor: 0xAAAAAA,
                sunIntensity: 0.2,
                ambientIntensity: 0.4,
                windSpeed: 0.2,
                rainIntensity: 0,
                snowIntensity: 0,
                cloudCoverage: 0.5
            },
            snow: {
                name: '雪',
                icon: '❄️',
                fogDensity: 0.01,
                fogColor: 0xFFFFFF,
                sunIntensity: 0.4,
                ambientIntensity: 0.6,
                windSpeed: 1.5,
                rainIntensity: 0,
                snowIntensity: 1.0,
                cloudCoverage: 0.8
            },
            storm: {
                name: '嵐',
                icon: '⛈️',
                fogDensity: 0.008,
                fogColor: 0x404040,
                sunIntensity: 0.1,
                ambientIntensity: 0.2,
                windSpeed: 4.0,
                rainIntensity: 2.0,
                snowIntensity: 0,
                cloudCoverage: 1.0,
                hasLightning: true
            }
        };
        
        // 天候遷移確率
        this.weatherTransitions = {
            sunny: { sunny: 0.7, cloudy: 0.25, foggy: 0.05 },
            cloudy: { cloudy: 0.5, sunny: 0.2, rainy: 0.25, foggy: 0.05 },
            rainy: { rainy: 0.6, cloudy: 0.3, storm: 0.1 },
            foggy: { foggy: 0.6, sunny: 0.2, cloudy: 0.2 },
            snow: { snow: 0.7, cloudy: 0.3 },
            storm: { storm: 0.3, rainy: 0.5, cloudy: 0.2 }
        };
        
        this.windForce = new THREE.Vector3();
        this.time = 0;
    }
    
    init() {
        // 霧の設定
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.001);
        
        // 雲の作成
        this.createClouds();
        
        // パーティクルシステムの初期化
        this.initRainParticles();
        this.initSnowParticles();
        
        console.log('✅ WeatherSystem 初期化完了');
    }
    
    // 雲の作成
    createClouds() {
        const cloudCount = 20;
        const cloudGeometry = new THREE.SphereGeometry(20, 8, 6);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.6,
            roughness: 1.0
        });
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = new THREE.Group();
            
            // 複数の球体で雲を構成
            for (let j = 0; j < 5; j++) {
                const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial.clone());
                sphere.position.set(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 30
                );
                sphere.scale.setScalar(0.5 + Math.random() * 0.5);
                cloud.add(sphere);
            }
            
            cloud.position.set(
                (Math.random() - 0.5) * 300,
                100 + Math.random() * 50,
                (Math.random() - 0.5) * 300
            );
            
            cloud.userData.baseY = cloud.position.y;
            cloud.userData.speed = 0.5 + Math.random() * 0.5;
            cloud.visible = false;
            
            this.cloudMeshes.push(cloud);
            this.scene.add(cloud);
        }
    }
    
    // 雨パーティクルの初期化
    initRainParticles() {
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i * 3] = 0;
            velocities[i * 3 + 1] = -20 - Math.random() * 10;
            velocities[i * 3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x6699CC,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        this.rainParticles = new THREE.Points(geometry, material);
        this.rainParticles.visible = false;
        this.scene.add(this.rainParticles);
    }
    
    // 雪パーティクルの初期化
    initSnowParticles() {
        const particleCount = 3000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            
            velocities[i * 3] = (Math.random() - 0.5) * 0.5;
            velocities[i * 3 + 1] = -1 - Math.random() * 2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            
            sizes[i] = 0.5 + Math.random() * 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.3,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            map: this.createSnowflakeTexture()
        });
        
        this.snowParticles = new THREE.Points(geometry, material);
        this.snowParticles.visible = false;
        this.scene.add(this.snowParticles);
    }
    
    // 雪の結晶テクスチャ作成
    createSnowflakeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // 雪の結晶を描画
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // 天候の変更
    changeWeather(weather, instant = false) {
        if (!this.weatherTypes[weather]) return;
        
        this.nextWeather = weather;
        if (instant) {
            this.currentWeather = weather;
            this.transitionProgress = 1.0;
            this.applyWeatherEffects(weather, 1.0);
        } else {
            this.transitionProgress = 0;
        }
    }
    
    // 天候エフェクトの適用
    applyWeatherEffects(weather, intensity) {
        const config = this.weatherTypes[weather];
        const currentConfig = this.weatherTypes[this.currentWeather];
        
        // 霧の更新
        if (this.scene.fog) {
            this.scene.fog.density = THREE.MathUtils.lerp(
                currentConfig.fogDensity,
                config.fogDensity,
                intensity
            );
            this.scene.fog.color.lerpColors(
                new THREE.Color(currentConfig.fogColor),
                new THREE.Color(config.fogColor),
                intensity
            );
        }
        
        // ライティングの更新
        const sunLight = this.scene.getObjectByName('sunLight');
        if (sunLight) {
            sunLight.intensity = THREE.MathUtils.lerp(
                currentConfig.sunIntensity,
                config.sunIntensity,
                intensity
            );
        }
        
        const ambientLight = this.scene.getObjectByName('ambientLight');
        if (ambientLight) {
            ambientLight.intensity = THREE.MathUtils.lerp(
                currentConfig.ambientIntensity,
                config.ambientIntensity,
                intensity
            );
        }
        
        // 雨の表示
        if (this.rainParticles) {
            const rainIntensity = THREE.MathUtils.lerp(
                currentConfig.rainIntensity,
                config.rainIntensity,
                intensity
            );
            this.rainParticles.visible = rainIntensity > 0;
            this.rainParticles.material.opacity = 0.6 * rainIntensity;
        }
        
        // 雪の表示
        if (this.snowParticles) {
            const snowIntensity = THREE.MathUtils.lerp(
                currentConfig.snowIntensity,
                config.snowIntensity,
                intensity
            );
            this.snowParticles.visible = snowIntensity > 0;
            this.snowParticles.material.opacity = 0.8 * snowIntensity;
        }
        
        // 雲の表示
        const cloudCoverage = THREE.MathUtils.lerp(
            currentConfig.cloudCoverage,
            config.cloudCoverage,
            intensity
        );
        this.updateCloudCoverage(cloudCoverage);
        
        // 風の強さ
        const windSpeed = THREE.MathUtils.lerp(
            currentConfig.windSpeed,
            config.windSpeed,
            intensity
        );
        this.windForce.x = Math.sin(this.time * 0.5) * windSpeed;
        this.windForce.z = Math.cos(this.time * 0.3) * windSpeed;
    }
    
    // 雲の密度更新
    updateCloudCoverage(coverage) {
        const visibleClouds = Math.floor(this.cloudMeshes.length * coverage);
        this.cloudMeshes.forEach((cloud, index) => {
            cloud.visible = index < visibleClouds;
            if (cloud.visible) {
                cloud.children.forEach(sphere => {
                    sphere.material.opacity = 0.3 + coverage * 0.4;
                });
            }
        });
    }
    
    // 雷エフェクト
    createLightningEffect() {
        if (Math.random() > 0.02) return; // 2%の確率で雷
        
        // フラッシュエフェクト
        const flash = new THREE.PointLight(0xFFFFFF, 10, 500);
        flash.position.set(
            (Math.random() - 0.5) * 200,
            100,
            (Math.random() - 0.5) * 200
        );
        this.scene.add(flash);
        
        // フラッシュアニメーション
        const duration = 200; // 200ms
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const progress = elapsed / duration;
                flash.intensity = 10 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(flash);
            }
        };
        animate();
    }
    
    // 次の天候を決定
    determineNextWeather(currentSeason) {
        const transitions = this.weatherTransitions[this.currentWeather];
        if (!transitions) return this.currentWeather;
        
        // 季節による調整
        let adjustedTransitions = { ...transitions };
        
        if (currentSeason === 'WINTER') {
            // 冬は雪の確率を上げる
            if (this.currentWeather === 'rainy') {
                adjustedTransitions = { snow: 0.7, cloudy: 0.3 };
            } else if (this.currentWeather === 'cloudy') {
                adjustedTransitions.snow = 0.3;
                adjustedTransitions.rainy = 0;
            }
        } else if (currentSeason === 'SUMMER') {
            // 夏は晴れの確率を上げる
            if (adjustedTransitions.sunny) {
                adjustedTransitions.sunny += 0.1;
            }
        }
        
        // 確率に基づいて次の天候を選択
        const random = Math.random();
        let cumulative = 0;
        
        for (const [weather, probability] of Object.entries(adjustedTransitions)) {
            cumulative += probability;
            if (random < cumulative) {
                return weather;
            }
        }
        
        return this.currentWeather;
    }
    
    // 更新処理
    update(deltaTime, currentSeason) {
        this.time += deltaTime;
        
        // 天候遷移の更新
        if (this.transitionProgress < 1.0) {
            this.transitionProgress += deltaTime / this.transitionDuration;
            if (this.transitionProgress >= 1.0) {
                this.transitionProgress = 1.0;
                this.currentWeather = this.nextWeather;
            }
            this.applyWeatherEffects(this.nextWeather, this.transitionProgress);
        }
        
        // パーティクルの更新
        this.updateRainParticles(deltaTime);
        this.updateSnowParticles(deltaTime);
        
        // 雲の更新
        this.updateClouds(deltaTime);
        
        // 雷エフェクト（嵐の時のみ）
        if (this.weatherTypes[this.currentWeather].hasLightning) {
            this.createLightningEffect();
        }
        
        // 一定時間ごとに天候を変更
        if (Math.random() < 0.0001) { // 約3分に1回の確率
            const nextWeather = this.determineNextWeather(currentSeason);
            if (nextWeather !== this.currentWeather) {
                this.changeWeather(nextWeather);
            }
        }
    }
    
    // 雨パーティクルの更新
    updateRainParticles(deltaTime) {
        if (!this.rainParticles.visible) return;
        
        const positions = this.rainParticles.geometry.attributes.position.array;
        const velocities = this.rainParticles.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // 位置更新
            positions[i] += (velocities[i] + this.windForce.x) * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += (velocities[i + 2] + this.windForce.z) * deltaTime;
            
            // 地面に到達したらリセット
            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = 100;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // 雪パーティクルの更新
    updateSnowParticles(deltaTime) {
        if (!this.snowParticles.visible) return;
        
        const positions = this.snowParticles.geometry.attributes.position.array;
        const velocities = this.snowParticles.geometry.attributes.velocity.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            // ゆらゆらと落下
            positions[i] += (velocities[i] + Math.sin(this.time + i) * 0.5 + this.windForce.x * 0.3) * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += (velocities[i + 2] + Math.cos(this.time + i) * 0.5 + this.windForce.z * 0.3) * deltaTime;
            
            // 地面に到達したらリセット
            if (positions[i + 1] < 0) {
                positions[i] = (Math.random() - 0.5) * 200;
                positions[i + 1] = 100;
                positions[i + 2] = (Math.random() - 0.5) * 200;
            }
        }
        
        this.snowParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    // 雲の更新
    updateClouds(deltaTime) {
        this.cloudMeshes.forEach(cloud => {
            if (!cloud.visible) return;
            
            // 風による移動
            cloud.position.x += this.windForce.x * cloud.userData.speed * deltaTime;
            cloud.position.z += this.windForce.z * cloud.userData.speed * deltaTime;
            
            // 上下の揺れ
            cloud.position.y = cloud.userData.baseY + Math.sin(this.time * 0.5 + cloud.position.x * 0.01) * 5;
            
            // 境界チェック
            if (cloud.position.x > 200) cloud.position.x = -200;
            if (cloud.position.x < -200) cloud.position.x = 200;
            if (cloud.position.z > 200) cloud.position.z = -200;
            if (cloud.position.z < -200) cloud.position.z = 200;
        });
    }
    
    // 現在の天候情報を取得
    getCurrentWeatherInfo() {
        const config = this.weatherTypes[this.currentWeather];
        return {
            type: this.currentWeather,
            name: config.name,
            icon: config.icon,
            windSpeed: this.windForce.length(),
            rainIntensity: config.rainIntensity,
            snowIntensity: config.snowIntensity
        };
    }
    
    // クリーンアップ
    dispose() {
        // パーティクルの削除
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles.geometry.dispose();
            this.rainParticles.material.dispose();
        }
        
        if (this.snowParticles) {
            this.scene.remove(this.snowParticles);
            this.snowParticles.geometry.dispose();
            this.snowParticles.material.dispose();
        }
        
        // 雲の削除
        this.cloudMeshes.forEach(cloud => {
            this.scene.remove(cloud);
            cloud.children.forEach(mesh => {
                mesh.geometry.dispose();
                mesh.material.dispose();
            });
        });
    }
}