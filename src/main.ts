import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Earth } from './earth';
import { Sun } from "./sun";
import { Space } from "./space";

class Engine {

    private readonly _scene: THREE.Scene;
    private readonly _camera: THREE.PerspectiveCamera;
    private readonly _renderer: THREE.WebGLRenderer;
    private _controls: OrbitControls;
    private readonly _earth: Earth;
    private readonly _sun: Sun;

    // Properties for the timer and journey information
    private _startTime: Date;
    private _endTime: Date;
    private _itinerary: { day: number, location: string }[];
    private _currentCountryIndex: number;

    constructor() {
        this._scene = new THREE.Scene();
        this._scene.fog = new THREE.Fog(this._scene.background, 3500, 15000);
        this._scene.background = new THREE.Color().setHSL(0.51, 0.4, 0.01, THREE.SRGBColorSpace);

        this._camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.01, 100);
        this._camera.position.z = 1;

        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.xr.enabled = false;
        this._renderer.shadowMap.autoUpdate = false;

        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.05;
        this._controls.minDistance = 0.550;
        this._controls.maxDistance = 2;

        const plight = new THREE.PointLight(0xffffff, 1);
        plight.position.set(1, 1, 1);
        this._scene.add(plight);

        this._scene.add(new Space());
        this._earth = new Earth(this._scene, this._camera);
        // this._sun = new Sun(this._scene);

        document.body.appendChild(this._renderer.domElement);

        window.addEventListener('resize', this._resize.bind(this));

        this._renderer.setAnimationLoop(this._animate.bind(this));

        // Initialize the timer and journey info
        this._initJourneyInfo();
    }

    // Initialize the journey timer and itinerary
    private _initJourneyInfo() {
        this._startTime = new Date(); // Journey start time
        this._endTime = new Date('2024-08-24T21:00:00'); // Journey end time
        this._itinerary = [
            { day: 11, location: "India" },
            { day: 10, location: "United Arab Emirates" },
            { day: 9, location: "Iran" },
            { day: 8, location: "Turkey" },
            { day: 7, location: "Greece" },
            { day: 6, location: "Italy" },
            { day: 5, location: "France" },
            { day: 4, location: "UK" },
            { day: 3, location: "Ireland" }
        ];
        this._currentCountryIndex = 0;

        this._updateTimeLeft();
        setInterval(this._updateTimeLeft.bind(this), 1000); // Update every second
    }

    // Update the remaining time, progress bar, and itinerary
    private _updateTimeLeft() {
        const currentTime = new Date();
        const timeDiff = this._endTime.getTime() - currentTime.getTime();
        const totalJourneyTime = this._endTime.getTime() - this._startTime.getTime();

        if (timeDiff < 0) {
            document.getElementById("timeLeft")!.innerText = `Journey Complete!`;
            this._updateProgressBar(100); // Set progress to 100%
            return;
        }

        const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        document.getElementById("timeLeft")!.innerText = `Time Left: ${daysLeft}d ${hoursLeft}h ${minutesLeft}m`;

        // Calculate progress percentage
        const progressPercentage = ((totalJourneyTime - timeDiff) / totalJourneyTime) * 100;
        this._updateProgressBar(progressPercentage);

        // Update the itinerary based on the current time
        this._updateJourneyInfo(progressPercentage);
    }

    // Update the progress bar
    private _updateProgressBar(percentage: number) {
        const progressBar = document.getElementById("progress")!;
        progressBar.style.width = `${percentage}%`;
    }

    // Update the current and upcoming countries in the itinerary
    private _updateJourneyInfo(progressPercentage: number) {
        const currentDay = Math.floor((100 - progressPercentage) / 10);
        this._itinerary.forEach((item, index) => {
            const dayDiv = document.getElementById(`day-${item.day}`);
            if (item.day <= currentDay && dayDiv) {
                dayDiv.classList.add("done");
            } else if (dayDiv) {
                dayDiv.classList.remove("done");
            }

            if (item.day === currentDay) {
                this._currentCountryIndex = index;
                document.getElementById("currentCountry")!.innerText = `Current Country: ${item.location}`;
            }
        });

        const upcoming = this._itinerary
            .slice(this._currentCountryIndex + 1)
            .map(item => item.location)
            .join(', ');

        document.getElementById("upcomingCountries")!.innerText = `Upcoming Countries: ${upcoming}`;
    }

    private _animate(time: number) {
        this._controls.update();
        this._earth.animate(time);
        this._renderer.render(this._scene, this._camera);
    }

    private _resize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

new Engine();
