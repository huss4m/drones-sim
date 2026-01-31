import { Scene, Engine, Vector3, FreeCamera, HemisphericLight, MeshBuilder, StandardMaterial, Texture, CubeTexture, PBRMaterial, SceneLoader, AssetsManager, Mesh, TransformNode, AssetContainer, InstantiatedEntries, Color3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Slider, TextBlock, Rectangle, Button } from "@babylonjs/gui";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import { Drone } from "./Drone";
import { AxesViewer } from "@babylonjs/core/Debug/axesViewer";
import { GridMaterial } from "@babylonjs/materials";
import { AnimationControlsUI } from "./AnimationControlsUI";

export class BasicScene
{

    scene: Scene;
    engine: Engine;
    droneContainer: AssetContainer | null = null;
    jsonData: any = null;
    framerate = 30;
    drones: Drone[] = [];
    currentTime = 0;
    isPlaying = true;

    private totalDurationSeconds = 0;

    private originalEntries: InstantiatedEntries | null = null;
    private originalDroneRoot: TransformNode | null = null;
    axesViewer: AxesViewer | null = null;
    private axesVisible = false;
    private gridMeshes: Mesh[] = [];
    private showGrid = false;
    private showVerticalLines = false;

    private animationUI: AnimationControlsUI | null = null;

    public collisionRadius = 2.5;
    public collisions: { time: number; droneIds: number[] }[] = [];


    public speedThreshold = 10;
    public speedViolations: { time: number; droneId: number; speed: number }[] = [];
    private previousPositions: Map<number, Vector3> = new Map();

    public onFrameUpdate?: () => void;
    private inSpeedViolation: Map<number, boolean> = new Map();
    private inCollision: Map<string, boolean> = new Map();

    constructor(private canvas:HTMLCanvasElement)
    {
        this.engine = new Engine(canvas, true);
        this.scene = this.CreateScene();
        this.loadAssets();
        //this.axesViewer = new AxesViewer(this.scene, 5);
    
        //this.loadWaypoints();
        
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateDrones();
        });

        this.engine.runRenderLoop(() => {
            this.scene.render();
        });


        window.addEventListener("keydown", (evt) => {
        if (evt.key.toLowerCase() === "t") {
            evt.preventDefault(); // évite le scroll par défaut si la page est scrollable

            const currentlyVisible = this.drones.length > 0 && this.drones[0].trajectoryVisible;
            const wantVisible = !currentlyVisible;

            this.drones.forEach(drone => {
                drone.setTrajectoryVisible(wantVisible);
            });
        }

        if (evt.key.toLowerCase() === "h") {
            evt.preventDefault();

            this.showGrid = !this.showGrid;

            this.gridMeshes.forEach(mesh => {
                if (mesh) mesh.isVisible = this.showGrid;
            });

        }


        if (evt.key === " ") {  // Espace pour toggle play/pause
            evt.preventDefault();
            //this.isPlaying = !this.isPlaying;
            this.setPlaying(!this.isPlaying);
            console.log(this.isPlaying ? "Play" : "Pause");
        }


        if (evt.key.toLowerCase() === "r") {  // R pour reset
            evt.preventDefault();
            this.currentTime = 0;
            this.isPlaying = true;
            this.updateDrones();
            this.speedViolations = [];
            this.collisions = [];
            this.previousPositions.clear();
            this.inSpeedViolation.clear();
            this.inCollision.clear();
            console.log("Reset à t=0");
        }

        if (evt.key.toLowerCase() === "a") {
            evt.preventDefault();
            this.axesVisible = !this.axesVisible;

            if (this.axesVisible) {
                if (!this.axesViewer) {
                    this.axesViewer = new AxesViewer(this.scene, 6);
                } else {
                    if (this.axesViewer) {
                        this.axesViewer.xAxis.isVisible = true;
                        this.axesViewer.yAxis.isVisible = true;
                        this.axesViewer.zAxis.isVisible = true;
                    }
                }
            } else {
                if (this.axesViewer) {
                    this.axesViewer.dispose();
                    this.axesViewer = null;
                }
            }
        }

        if (evt.key.toLowerCase() === "n") {
            evt.preventDefault();
            const wantVisible = ! (this.drones[0]?.nameLabel?.isVisible ?? false);
            this.drones.forEach(drone => {
                if (drone.nameLabel) drone.nameLabel.isVisible = wantVisible;
            });
        }


        if (evt.key.toLowerCase() === "v") {  // V pour Vertical lines
            evt.preventDefault();
            const wantVisible = !this.drones[0]?.verticalLineVisible;  // toggle basé sur le premier
            this.drones.forEach(drone => {
                drone.verticalLineVisible = wantVisible;
                if (drone.verticalLine) drone.verticalLine.isVisible = wantVisible;
            });
            console.log(wantVisible ? "Lignes verticales affichées" : "Lignes verticales cachées");
        }
    });


    
    }

    CreateScene(): Scene
    {
        const scene = new Scene(this.engine);

        const camera = new FreeCamera("camera", new Vector3(2,2,0), this.scene);

        camera.attachControl();
        camera.keysUp.push(90);    // Z
        camera.keysDown.push(83);  // S
        camera.keysLeft.push(81);  // Q
        camera.keysRight.push(68); // D
        camera.speed = 10;
        camera.angularSensibility = 700;
        camera.inertia = 0.2;


        const hemiLight = new HemisphericLight("hemilight", new Vector3(0,1,0), this.scene);



        hemiLight.intensity = 0.8;


        const envTex = CubeTexture.CreateFromPrefilteredData("./environment/sky2.env", scene);
        scene.environmentTexture = envTex;
        scene.environmentIntensity = 0.5;
        scene.createDefaultSkybox(envTex, true);


        const ground = MeshBuilder.CreateGround("ground", {width:1000, height:1000}, this.scene);

        //const ball = MeshBuilder.CreateSphere("ball", { diameter: 1 }, this.scene);

        //ball.position = new Vector3(0,1,0);



        ground.material = this.CreateGroundMaterial();



        const gridMat = new GridMaterial("gridMat", scene);
        gridMat.majorUnitFrequency = 10;
        gridMat.minorUnitVisibility = 0.6; 
        gridMat.gridOffset = new Vector3(0, 0, 0);
        gridMat.lineColor = new Color3(0.8, 0.8, 1);
        gridMat.mainColor = new Color3(0.2, 0.2, 0.3);
        gridMat.opacity = 0.65;
        gridMat.backFaceCulling = false;


        const horizontalGrid = MeshBuilder.CreateGround("grid_horizontal", { width: 1200, height: 1200, subdivisions: 1 }, scene);
        horizontalGrid.position.y = 0.05;
        horizontalGrid.material = gridMat;
        horizontalGrid.isVisible = false;
        this.gridMeshes.push(horizontalGrid);


        const verticalGrid1 = MeshBuilder.CreateGround("grid_vertical_yz", { width: 1200, height: 400 }, scene);
        verticalGrid1.rotation.x = Math.PI / 2;
        verticalGrid1.position = new Vector3(0, 200, 0);
        verticalGrid1.material = gridMat;
        verticalGrid1.isVisible = false;
        this.gridMeshes.push(verticalGrid1);

        const verticalGrid2 = verticalGrid1.clone("grid_vertical_xz");
        verticalGrid2.rotation.y = Math.PI / 2;
        verticalGrid2.position = new Vector3(0, 200, 0);
        verticalGrid2.material = gridMat;
        verticalGrid2.isVisible = false;
        this.gridMeshes.push(verticalGrid2);


        return scene;
    }


    CreateGroundMaterial(): PBRMaterial {
    const TILING = 100;

    const pbr = new PBRMaterial("pbr", this.scene);

    pbr.albedoTexture = new Texture(
        "./textures/rocks/coast_sand_rocks_02_diff_1k.jpg",
        this.scene
    );

    pbr.bumpTexture = new Texture(
        "./textures/rocks/coast_sand_rocks_02_nor_gl_1k.jpg",
        this.scene
    );

    pbr.metallicTexture = new Texture(
        "./textures/rocks/coast_sand_rocks_02_arm_1k.jpg",
        this.scene
    );

    pbr.invertNormalMapX = true;
    pbr.invertNormalMapY = true;

    pbr.useAmbientOcclusionFromMetallicTextureRed = true;
    pbr.useRoughnessFromMetallicTextureGreen = true;
    pbr.useMetallnessFromMetallicTextureBlue = true;

    const albedo = pbr.albedoTexture as Texture;
    const normal = pbr.bumpTexture as Texture;
    const metallic = pbr.metallicTexture as Texture;

    albedo.uScale = albedo.vScale = TILING;
    normal.uScale = normal.vScale = TILING;
    metallic.uScale = metallic.vScale = TILING;

    albedo.anisotropicFilteringLevel = 8;

    return pbr;
}

    private async loadAssets() 
    {
        const assetsManager = new AssetsManager(this.scene);
        const droneTask = assetsManager.addContainerTask("drone", "", "./models/", "drone2.glb");

        droneTask.onSuccess = (task) => {
            this.droneContainer = task.loadedContainer;
        };

        assetsManager.onFinish = async () => {
        if (!this.droneContainer) {
            return;
        }

        this.originalEntries = this.droneContainer.instantiateModelsToScene();
        if (this.originalEntries.rootNodes.length > 0) {
            this.originalDroneRoot = this.originalEntries.rootNodes[0] as TransformNode;
            this.originalDroneRoot.setEnabled(false);
        }
        const jsonData = await this.loadWaypoints();
        if (jsonData?.drones) {
            this.createDronesFromJson(jsonData.drones);
        }

        this.calculateTotalDuration();



        this.animationUI = new AnimationControlsUI(this.scene, this.totalDurationSeconds);

        // Branche les callbacks
        this.animationUI.onTimeChanged = (newTime: number) => {
            this.currentTime = newTime;
            this.drones.forEach(drone => drone.update(this.currentTime, this.framerate));
            this.isPlaying = false;  // pause pendant scrubbing
            this.previousPositions.clear();
            this.inSpeedViolation.clear();
            this.collisions = [];
            this.speedViolations = [];
            this.inCollision.clear();
            if (this.onFrameUpdate) {
                this.onFrameUpdate();
            }
        };

        this.animationUI.onPlayPauseToggled = (isPlaying: boolean) => {
            this.isPlaying = isPlaying;
        };

        this.animationUI.onReset = () => {
            this.currentTime = 0;
            this.previousPositions.clear();
            this.inSpeedViolation.clear();
            this.inCollision.clear();
            this.isPlaying = true;
            this.drones.forEach(drone => drone.update(0, this.framerate));
            if (this.animationUI) this.animationUI.resetUI();

            this.collisions = [];
            this.speedViolations = [];

            if (this.onFrameUpdate) {
                this.onFrameUpdate();
            }

        };
    };

    assetsManager.load();
    }


    private async loadWaypoints() {
        try {
            const response = await fetch("./waypoints/waypoints2.json");
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            this.jsonData = data;
            this.framerate = data.framerate || 30;

            return data;
        } catch (err) {
            return null;
        }
    }

    private createDronesFromJson(dronesData: any[]) 
    {
        if (!this.droneContainer) {
            return;
        }

        this.drones = dronesData.map((droneData: any, index: number) => {
            const drone = new Drone(
                droneData.id,
                this.droneContainer!,
                this.scene,
                droneData.waypoints
            );


            drone.createWaypointVisuals(this.scene, new Color3(1,1,1));
            drone.createTrajectoryLines(this.scene, new Color3(1,1,1));
            drone.setTrajectoryVisible(false);

            return drone;
        });

        console.log(`Créés ${this.drones.length} drones`);
    }

    private updateDrones() 
    {

        if (!this.isPlaying) return;

        const delta = this.engine.getDeltaTime() / 1000;
        this.currentTime += delta;

        if (this.currentTime > this.totalDurationSeconds) {
            this.currentTime = this.totalDurationSeconds;
            this.isPlaying = false;
            if (this.animationUI) this.animationUI.setPlayState(false);
            //console.log("Collisions détectées :", this.collisions);
        }

        this.drones.forEach(drone => drone.update(this.currentTime, this.framerate));


        // Détection collisions
        for (let i = 0; i < this.drones.length; i++) {
            for (let j = i + 1; j < this.drones.length; j++) {
                const drone1 = this.drones[i];
                const drone2 = this.drones[j];
                const dist = Vector3.Distance(drone1.root.position, drone2.root.position);

                const idMin = Math.min(drone1.id, drone2.id);
                const idMax = Math.max(drone1.id, drone2.id);
                const pairKey = `${idMin}-${idMax}`;

                if (dist < 2 * this.collisionRadius) {
                    const wasInCollision = this.inCollision.get(pairKey) ?? false;

                    if (!wasInCollision) {
                        const timeRounded = Math.round(this.currentTime * 10) / 10;
                        const existing = this.collisions.find(c => 
                            c.time === timeRounded && 
                            c.droneIds.includes(drone1.id) && 
                            c.droneIds.includes(drone2.id)
                        );
                        if (!existing) {
                            this.collisions.push({ time: timeRounded, droneIds: [drone1.id, drone2.id] });
                        }
                    }
                    this.inCollision.set(pairKey, true);
                } else {
                    this.inCollision.set(pairKey, false);
                }
            }
        }

        // Détection vitesse excessive
        this.drones.forEach(drone => {
            const currentPos = drone.root.position.clone();
            const prevPos = this.previousPositions.get(drone.id);
            
            if (prevPos) {
                const deltaPos = Vector3.Distance(currentPos, prevPos);
                const deltaTime = this.engine.getDeltaTime() / 1000;
                
                if (deltaTime > 0) {
                    const speed = deltaPos / deltaTime;
                    
                    const timeRounded = Math.round(this.currentTime * 10) / 10;
                    
                    if (speed > this.speedThreshold) {
                        const wasInViolation = this.inSpeedViolation.get(drone.id) ?? false;
                        
                        if (!wasInViolation) {
                            this.speedViolations.push({ time: timeRounded, droneId: drone.id, speed: speed });
                            this.inSpeedViolation.set(drone.id, true);
                        }
                    } else {

                        this.inSpeedViolation.set(drone.id, false);
                    }
                }
            }
            
            this.previousPositions.set(drone.id, currentPos);
        });

        if (this.animationUI) {
            this.animationUI.updateTime(this.currentTime);
        }



        if (this.onFrameUpdate) {
            this.onFrameUpdate();
        }
    }


    private calculateTotalDuration() {
        let maxFrame = 0;
        this.drones.forEach(drone => {
            if (drone.waypoints.length > 0) {
                const lastFrame = drone.waypoints[drone.waypoints.length - 1].frame;
                if (lastFrame > maxFrame) maxFrame = lastFrame;
            }
        });
        this.totalDurationSeconds = maxFrame / this.framerate;
       // console.log(`Durée totale : ${this.totalDurationSeconds.toFixed(2)} secondes`);
    }



    private setPlaying(newState: boolean) {
        this.isPlaying = newState;

        if (this.animationUI) {
            this.animationUI.setPlayState(newState);
        }
    }

}