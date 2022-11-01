import { Camera } from "./camera";
import { Color } from "./color";
import { InputValues, Marker } from "./input";
import { elasticCoefficient, gravitationalForce, randomInt } from "./math";
import { Planet } from "./planet";
import { SimData } from "./sim-data";
import { Vector2 } from "./vector";

export class SimController {
    simRunning: boolean = false;
    targetFps: number = 120;
    realFps: number = 0;
    minimumFps: number = 36;
    objects: Set<Planet>;
    maxTrailLength: number = 300;
    canvas: HTMLCanvasElement;
    timerId?: NodeJS.Timer;

    cameraStartingPos: Vector2;
    camera: Camera;
    markerData: Marker = {
        maxRadius: 800,
        minRadius: 2,
        maxDensity: 500000,
        minDensity: 15,
        radius: 10,
        density: 500,
        position: new Vector2(),
        velocity: new Vector2(),
        direction: [],
        readyToCreate: false,
    };
    inputValues: InputValues = {
        mouseLeftDown: false,
        mouseMiddleDown: false,
        mouseRightDown: false,
        mousePos: new Vector2(),
        keysDown: new Set(),
    };

    simData: SimData = {
        paused: false,
        bounce: true,
        maxDistance: 1e9,
        maxSpeedup: 64,
        speedup: 4,
        minSpeedup: 0.25,
        step: 5000
    }

    constructor(id: string, cameraPosition: Vector2, renderUi: boolean = true, renderBg: boolean = true) {
        this.canvas = document.getElementById(id)! as HTMLCanvasElement;
        this.objects = new Set();
        this.cameraStartingPos = cameraPosition;
        this.camera = new Camera(this.canvas, this.cameraStartingPos, renderUi, renderBg);
        console.log("cam init")

        this.resetSim();
        this.camera.render(Array.from(this.objects), this.markerData);

        this.canvas.addEventListener('mousemove', this.getMousePosition.bind(this));
        this.canvas.addEventListener('mousedown', this.getMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.getMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (event) => { event.preventDefault(); });
        // canvas.addEventListener('keydown', (event) => {console.log(event)});
        this.canvas.addEventListener('keydown', this.getKeyDown.bind(this));
        this.canvas.addEventListener('keyup', this.getKeyUp.bind(this));
        this.canvas.addEventListener("wheel", this.handleScroll.bind(this));
        this.canvas.addEventListener("mouseenter", () => {this.camera.renderUI = true;});
        this.canvas.addEventListener("mouseleave", () => {this.camera.renderUI = false;});

    }

    resetSim() {
        this.camera.position = this.cameraStartingPos.copy();
        this.camera.zoom = 1;

        this.simData.speedup = 4;

        this.objects.clear();
        this.objects.add(
            new Planet(
                new Vector2(),
                100,
                1400,
                new Vector2(),
                new Color('#ffdd00'),
                'sun'));
        this.objects.add(
            new Planet(
                new Vector2(450, 0),
                12,
                1600,
                new Vector2(0, 0.03),
                new Color('#2aabde'),
                'earth'));
        this.objects.add(
            new Planet(
                new Vector2(425, 1),
                2,
                15,
                new Vector2(0, 0.036),
                new Color('#ffddee')));
    }

    updateObjects(placeholderFps?: number) {
        // update camera
        var cameraMovement = new Vector2();
        if (this.inputValues.keysDown.has('KeyW'))
            cameraMovement = cameraMovement.add(new Vector2(0, 1));
        if (this.inputValues.keysDown.has('KeyA'))
            cameraMovement = cameraMovement.add(new Vector2(-1, 0));
        if (this.inputValues.keysDown.has('KeyS'))
            cameraMovement = cameraMovement.add(new Vector2(0, -1));
        if (this.inputValues.keysDown.has('KeyD'))
            cameraMovement = cameraMovement.add(new Vector2(1, 0));

        if (cameraMovement.length > 0.001) {
            cameraMovement.normalize();
        }

        this.camera.position = this.camera.position.add(cameraMovement.scale(this.camera.frustrumWidth / (2 * this.camera.zoom * this.realFps)));

        // simulate objects 
        if (!this.simData.paused) {

            for (let i = 0; i <= this.simData.speedup; i++) {
                var fps = (placeholderFps ? placeholderFps : this.realFps) * this.simData.speedup;
                // update objects 
                var deleteObjects = [];
                for (const obj of this.objects) {
                    var resultingForce = new Vector2()
                    //remove obj if too far away
                    if (obj.position.length > this.simData.maxDistance || obj.markedForDeletion) {
                        deleteObjects.push(obj);
                    } else {
                        for (const obj2 of this.objects) {
                            // check if it's a valid obj
                            if (obj != obj2 && !obj2.markedForDeletion) {
                                // check for colision
                                var positionOffset = obj2.position.sub(obj.position);
                                if (positionOffset.length > obj.radius + obj2.radius) {
                                    resultingForce = resultingForce.add(gravitationalForce(obj, obj2));
                                } else {
                                    if (this.simData.bounce) {
                                        var relativeVelocity = obj2.velocity.sub(obj.velocity);
                                        var dampedVelocity = relativeVelocity.scale(1 + elasticCoefficient);
                                        var contactNormal = positionOffset.normalize();
                                        var impulse = (dampedVelocity.dot(contactNormal)) / (contactNormal.dot(contactNormal) * (1 / obj.mass + 1 / obj2.mass));

                                        obj.velocity = obj.velocity.add(contactNormal.scale(impulse / obj.mass));
                                        obj2.velocity = obj2.velocity.sub(contactNormal.scale(impulse / obj2.mass));
                                    } else {
                                        if (obj.mass < obj2.mass) {
                                            obj.markedForDeletion = true;
                                            // obj2.mass += obj.mass;
                                            deleteObjects.push(obj);
                                        } else {
                                            obj2.markedForDeletion = true;
                                            // obj.mass += obj2.mass;
                                            deleteObjects.push(obj2);
                                        }
                                    }
                                }
                            }
                        }
                        var acceleration = resultingForce.scale(1 / obj.mass);

                        if (obj.trail.length > this.maxTrailLength) {
                            obj.trail.shift();
                        }

                        obj.trail.push(obj.position);

                        obj.velocity = obj.velocity.add(acceleration.scale(this.simData.step / fps));
                        obj.position = obj.position.add(obj.velocity.scale(this.simData.step / fps));
                    }
                }
                for (const obj of deleteObjects) {
                    this.objects.delete(obj);
                }
            }
        }
    }

    startSim() {
        this.canvas.focus();
        if (!this.simRunning) {
            console.log("running");
            this.simRunning = true;
            var lastTimestamp = performance.now();
            this.timerId = setInterval(() => {
                var curTimestamp = performance.now();
                this.realFps = 1000 / (curTimestamp - lastTimestamp);
                lastTimestamp = curTimestamp;

                if (this.realFps < this.minimumFps) {
                    var iterations = Math.round(this.minimumFps / this.realFps)
                    // console.log(this.realFps, iterations);
                    for (let i = 0; i < iterations; i++) {
                        this.updateObjects(this.minimumFps);
                    }
                }
                else {
                    this.updateObjects();
                }
                this.camera.clear();
                this.camera.render(Array.from(this.objects), this.markerData);
            }, 1000 / this.targetFps);
        }
    }

    destroy() {
        clearInterval(this.timerId);
    }

    private getMousePosition(event: MouseEvent) {
        const rect = this.camera.canvasElement.getBoundingClientRect();
        this.inputValues.mousePos = new Vector2(event.clientX - rect.left, event.clientY - rect.top);

        if (!this.markerData.readyToCreate) {
            this.markerData.position = this.camera.convertRasterCoordToWorld(this.inputValues.mousePos);
            this.markerData.velocity = new Vector2();
        } else {
            let mouseWorldPos = this.camera.convertRasterCoordToWorld(this.inputValues.mousePos);
            let deltaPos = this.markerData.position.sub(mouseWorldPos);
            this.markerData.velocity = deltaPos.scale(1 / this.simData.step);
            this.markerData.direction = [this.markerData.position, this.markerData.position.add(deltaPos)];
        }
    }

    private getMouseDown(event: MouseEvent) {
        if (this.simRunning) {
            switch (event.button) {
                case 0:
                    this.inputValues.mouseLeftDown = true;
                    this.markerData.position = this.camera.convertRasterCoordToWorld(this.inputValues.mousePos);
                    this.markerData.readyToCreate = true;
                    break;
                case 1:
                    this.inputValues.mouseMiddleDown = true;
                    break;
                case 2:
                    this.inputValues.mouseRightDown = true;
                    break;
                default:
                    console.error(`Unknown button code: ${event.button}`);

                    break;
            }
        }
    }

    private getMouseUp(event: MouseEvent) {
        if (this.simRunning) {
            switch (event.button) {
                case 0:
                    this.inputValues.mouseLeftDown = false;

                    // update marker
                    this.markerData.direction = [];
                    // create object
                    if (this.markerData.readyToCreate) {
                        let color = new Color(randomInt(50, 256), randomInt(50, 256), randomInt(50, 256));
                        this.objects.add(new Planet(
                            this.markerData.position.copy(),
                            this.markerData.radius,
                            this.markerData.density,
                            this.markerData.velocity.copy(),
                            color
                        ));

                        this.markerData.readyToCreate = false;
                    }
                    break;
                case 1:
                    this.inputValues.mouseMiddleDown = false;
                    break;
                case 2:
                    this.inputValues.mouseRightDown = false;

                    // update marker
                    this.markerData.direction = [];
                    this.markerData.readyToCreate = false;
                    break;
                default:
                    console.error(`Unknown button code: ${event.button}`);
                    break;
            }
        }
    }

    private getKeyDown(event: KeyboardEvent) {
        console.log("key down")
        if (this.simRunning) {
            this.inputValues.keysDown.add(event.code);
        }
    }

    private getKeyUp(event: KeyboardEvent) {
        if (this.simRunning) {

            this.handleKeyUp(event.code);
            this.inputValues.keysDown.delete(event.code);
        }
    }

    private handleScroll(event: WheelEvent) {
        if (this.simRunning) {
            console.log(this.inputValues.keysDown);
            if (event.deltaY < 0) {
                if (this.inputValues.keysDown.has("KeyZ")) {
                    if (this.markerData.radius < this.markerData.maxRadius) {
                        this.markerData.radius *= 1.25;
                    }
                } else
                    if (this.inputValues.keysDown.has("KeyX")) {
                        if (this.markerData.density < this.markerData.maxDensity) {
                            this.markerData.density *= 1.25;
                        }
                    } else
                        if (this.camera.zoom < this.camera.maxZoom) {
                            this.camera.zoom = this.camera.zoom * 1.5;
                        }
            }
            if (event.deltaY > 0) {
                if (this.inputValues.keysDown.has("KeyZ")) {
                    if (this.markerData.radius > this.markerData.minRadius) {
                        this.markerData.radius *= 0.8;
                    }
                } else
                    if (this.inputValues.keysDown.has("KeyX")) {
                        if (this.markerData.density > this.markerData.minDensity) {
                            this.markerData.density *= 0.8;
                        }
                    } else
                        if (this.camera.zoom > this.camera.minZoom) {
                            this.camera.zoom = this.camera.zoom / 1.5;
                        }
            }
        }
    }

    private handleKeyUp(code: string) {
        switch (code) {
            case 'KeyQ':
                this.camera.position = this.cameraStartingPos.copy();
                break;
            case 'KeyR':
                this.resetSim()
                break;
            case 'KeyT':
                this.camera.renderTrail = !this.camera.renderTrail;
                break;
            case 'KeyP':
                this.simData.paused = !this.simData.paused;
                break;
            case 'KeyH':
                this.camera.renderHelp = !this.camera.renderHelp;
                break;
            case 'KeyC':
                this.markerData.radius = 10;
                this.markerData.density = 500;
                break;
            case 'KeyB':
                this.simData.bounce = !this.simData.bounce;
                break;
            case 'Comma':
                var newSimSpeed = 2 * this.simData.speedup;
                this.simData.speedup = this.simData.maxSpeedup < newSimSpeed ? this.simData.maxSpeedup : newSimSpeed;
                console.log(this.simData.speedup);
                break;
            case 'Period':
                var newSimSpeed = 0.5 * this.simData.speedup;
                this.simData.speedup = this.simData.minSpeedup > newSimSpeed ? this.simData.minSpeedup : newSimSpeed;
                console.log(this.simData.speedup);
                break;
            default:
                break;
        }
    }
}