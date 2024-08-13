// @ts-ignore
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Earth {

    public readonly earth : THREE.Mesh;
    public readonly clouds : THREE.Mesh;
    public readonly atmosphere : THREE.Mesh;
    private user;
    private marker; // Newly added marker property

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {

        const cloudTexture = new THREE.TextureLoader().load( require('./assets/images/8k_earth_clouds.jpg')  ),
              earthDayTexture = new THREE.TextureLoader().load( require('./assets/images/8k_earth_daymap.jpg') ),
              earthNightTexture = new THREE.TextureLoader().load( require('./assets/images/8k_earth_nightmap.jpg') ),
              bumpTexture  = new THREE.TextureLoader().load( require('./assets/images/8081_earthbump10k.jpg')),
              earthSpecTexture = new THREE.TextureLoader().load( require('./assets/images/8081_earthspec10k.jpg'));

        const earthMaterial = new THREE.MeshPhongMaterial({
            bumpMap: bumpTexture,
            bumpScale: 0.003,
            map: earthDayTexture,
            emissiveMap: earthNightTexture,
            emissive: new THREE.Color(0x888888),
            emissiveIntensity: 1,
            specularMap: earthSpecTexture,
            specular: 1,
            shininess: 30,
        });
        const cloudsMaterial = new THREE.MeshPhongMaterial({
            map: cloudTexture,
            alphaMap : cloudTexture,
            transparent: true,
            alphaTest: 0.0001,
            side: THREE.DoubleSide,
        });
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                    "c":   { type: "f", value: 1 },
                    "p":   { type: "f", value: 1 },
                    glowColor: { type: "c", value: new THREE.Color(0x00b3ff) },
                    viewVector: { type: "v3", value: camera.position }
                },
            vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
            fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
            side: THREE.FrontSide,
            blending: THREE.AdditiveBlending ,
            transparent: true,
        });

        this.earth = new THREE.Mesh( new THREE.SphereGeometry( 0.5, 60, 60 ), earthMaterial );
        this.clouds = new THREE.Mesh( new THREE.SphereGeometry( 0.505, 60, 60 ), cloudsMaterial );
        this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry( 0.511, 60, 60 ), atmosphereMaterial);

        scene.add( this.earth );
        scene.add( this.clouds );
        scene.add( this.atmosphere );

        this._addUserPosition();

        // New code for marker initialization
        this._initMarker(scene);
    }

    private _addUserPosition() {

        new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        })
            .then((coordinates: any) => {

                const { latitude, longitude } = coordinates.coords,
                    phi = (90 - latitude) * (Math.PI / 180),
                    theta = (longitude + 180) * (Math.PI / 180),
                    earthRadius = this.earth.geometry.parameters.radius;

                const surfacePosition = new THREE.Vector3(
                    -earthRadius * Math.sin(phi) * Math.cos(theta),
                    earthRadius * Math.cos(phi),
                    earthRadius * Math.sin(phi) * Math.sin(theta)
                );

                const userRadius = .0065;

                this.user = new THREE.Mesh(
                    new THREE.SphereGeometry(userRadius, 32, 32),
                    new THREE.MeshBasicMaterial({
                        color: 0x4ade80,
                        opacity: 0.5,
                        transparent: true,
                    })
                );

                this.user.position.copy(surfacePosition).add(new THREE.Vector3(0, userRadius, 0));
                this.earth.add(this.user);

            });

    }

    // New function to initialize the marker for the path
    private _initMarker(scene: THREE.Scene) {
        const markerGeometry = new THREE.SphereGeometry(0.01, 32, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.marker = new THREE.Mesh(markerGeometry, markerMaterial);
        scene.add(this.marker);

        this._animateMarker();
    }

    // New function to convert latitude/longitude to 3D coordinates on the globe
    private _latLongToVector3(lat: number, lon: number, radius: number, height: number) {
        const phi = (lat) * Math.PI / 180;
        const theta = (lon - 180) * Math.PI / 180;

        const x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
        const y = (radius + height) * Math.sin(phi);
        const z = (radius + height) * Math.cos(phi) * Math.sin(theta);

        return new THREE.Vector3(x, y, z);
    }

    // New function to animate the marker along the path
    private _animateMarker() {
        const path = [
            [77.0369, 30.3165], // Dehradun
            [72.8777, 19.0760], // Mumbai
            [56.2663, 25.2760], // Dubai
            [51.3890, 35.6892], // Tehran
            [28.9784, 41.0082], // Istanbul
            [12.4964, 41.9028], // Rome
            [2.3522, 48.8566],  // Paris
            [0.1276, 51.5074],  // London
            [-6.2603, 53.3498], // Dublin
        ];

        let currentIndex = 0;

        const animate = () => {
            if (currentIndex < path.length) {
                const [lon, lat] = path[currentIndex];
                const position = this._latLongToVector3(lat, lon, this.earth.geometry.parameters.radius, 0.005);
                this.marker.position.copy(position);

                currentIndex++;
            }
            requestAnimationFrame(animate);
        };

        animate();
    }

    public animate(time: number) {
        this.earth.rotation.y = time * 0.00002;
        this.clouds.rotation.y = time * 0.00001;
        // TWEEN.update();
    }

}
