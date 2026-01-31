import { TransformNode, AssetContainer, Scene, Vector3, Mesh, MeshBuilder, StandardMaterial, Color3, LinesMesh, VertexBuffer } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Slider, TextBlock, Rectangle, Button } from "@babylonjs/gui";

export class Drone {
    root: TransformNode;
    id: number;
    waypoints: { frame: number; position: Vector3 }[] = [];
    private waypointSpheres: Mesh[] = [];
    public trajectoryLines: Mesh[] = [];
    public trajectoryVisible = false;

    public verticalLine: LinesMesh | null = null;
    public verticalLineVisible = false;
    scene: Scene;

    public nameLabel: Mesh | null = null;
    public nameTexture: AdvancedDynamicTexture | null = null;

    constructor(id: number, container: AssetContainer, scene: Scene, waypointsRaw: any[]) {
        this.id = id;
        this.scene = scene;

        // Instanciation du modèle
        const entries = container.instantiateModelsToScene(undefined, true);
        this.root = entries.rootNodes[0] as TransformNode;
        this.root.name = `drone_${this.id}`;

        // Animation interne 
        if (entries.animationGroups && entries.animationGroups.length > 0) {
            entries.animationGroups[1].play(true);
        }

        // division par 5 pour échelle visuelle confortable
        this.waypoints = waypointsRaw.map((wp: any) => ({
            frame: wp.frame,
            position: new Vector3(
                wp.position.lng_X / 5,
                wp.position.alt_Y / 5,
                wp.position.lat_Z / 5
            )
        }));

        // Position initiale = premier waypoint
        if (waypointsRaw.length > 0) {
            const firstPos = waypointsRaw[0].position;
            this.root.position = new Vector3(
                firstPos.lng_X / 5,
                firstPos.alt_Y / 5,
                firstPos.lat_Z / 5
            );
        }
        this.createNameLabel();
        this.createVerticalLine();
    }


    update(timeSeconds: number, framerate: number) 
    {
        if (this.waypoints.length < 2) 
        {
            return;
        }

        const currentFrame = timeSeconds * framerate;

        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const wp1 = this.waypoints[i];
            const wp2 = this.waypoints[i + 1];

            if (currentFrame >= wp1.frame && currentFrame <= wp2.frame) {
                const t = (currentFrame - wp1.frame) / (wp2.frame - wp1.frame);
                Vector3.LerpToRef(wp1.position, wp2.position, t, this.root.position);
                return;
            }
        }

        this.root.position = this.waypoints[this.waypoints.length - 1].position.clone();

        // Update ligne verticale
        if (this.verticalLine && this.verticalLineVisible) {
            const points = this.verticalLine.getVerticesData(VertexBuffer.PositionKind) as Float32Array;
            if (points && points.length === 6) {
                // Point haut = position drone
                points[0] = this.root.position.x;
                points[1] = this.root.position.y;
                points[2] = this.root.position.z;

                // Point bas = projection sol Y=0
                points[3] = this.root.position.x;
                points[4] = 0;
                points[5] = this.root.position.z;

                this.verticalLine.setVerticesData(VertexBuffer.PositionKind, points);
            }
        }
    }

    createTrajectoryLines(scene: Scene, color: Color3): void {
        this.trajectoryLines.forEach(line => line.dispose());
        this.trajectoryLines = [];

        if (this.waypoints.length < 2) {
            return;
        }

        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const pos1 = this.waypoints[i].position;
            const pos2 = this.waypoints[i + 1].position;

            const line = MeshBuilder.CreateLines(
                `trajectory_drone${this.id}_segment${i}`,
                { points: [pos1.clone(), pos2.clone()] },
                scene
            );

            line.color = color;
            line.alpha = 0.85;

            this.trajectoryLines.push(line);
        }
    }


    setTrajectoryVisible(visible: boolean): void {
        this.trajectoryLines.forEach(line => {
            line.isVisible = visible;
        });
        
        this.waypointSpheres.forEach(sphere => {
            sphere.isVisible = visible;
        });

        this.trajectoryVisible = visible;
    }


    createWaypointVisuals(scene: Scene, color: Color3 = new Color3(1, 0, 0)): void {
        this.waypointSpheres.forEach(s => s.dispose());
        this.waypointSpheres = [];

        this.waypoints.forEach((wp, index) => {
            const sphere = MeshBuilder.CreateSphere(
                `wp_sphere_drone${this.id}_${index}`,
                { diameter: 0.3 },
                scene
            );
            sphere.position = wp.position.clone();

            const material = new StandardMaterial(`wp_mat_${index}`, scene);
            material.diffuseColor = color;
            material.emissiveColor = color.scale(0.4);
            material.alpha = 0.7;
            sphere.material = material;


            this.waypointSpheres.push(sphere);
            
        });
    }

    private createNameLabel(): void {
        this.nameLabel = MeshBuilder.CreatePlane(`label_drone_${this.id}`, { width: 4, height: 1 }, this.scene);
        this.nameLabel.parent = this.root; 
        this.nameLabel.position.y = -3; // axe Y du modèle semble inversé?
        this.nameLabel.billboardMode = Mesh.BILLBOARDMODE_ALL;

        this.nameTexture = AdvancedDynamicTexture.CreateForMesh(this.nameLabel as Mesh, 512, 128); 
        this.nameLabel.rotation.x = -Math.PI;

        const textBlock = new TextBlock();
        textBlock.text = `Drone ${this.id}`;
        textBlock.color = "white";
        textBlock.fontSize = 60;
        textBlock.outlineWidth = 4;
        textBlock.outlineColor = "black";
        textBlock.shadowBlur = 4;
        textBlock.shadowColor = "black";
        textBlock.shadowOffsetX = 2;
        textBlock.shadowOffsetY = 2;
        this.nameTexture.addControl(textBlock);
    }


    private createVerticalLine(): void {
        if (this.verticalLine) this.verticalLine.dispose();
        
        this.verticalLine = null;

        const groundPos = new Vector3(0, -this.root.position.y, 0);

        this.verticalLine = MeshBuilder.CreateLines(
            `vertical_line_drone_${this.id}`,
            { 
                points: [
                    new Vector3(0, 0, 0),
                    groundPos
                ]
            },
            this.scene
        );

        this.verticalLine.parent = this.root;

        this.verticalLine.position = Vector3.Zero();

        this.verticalLine.color = new Color3(0.4, 0.8, 1);
        this.verticalLine.alpha = 0.6;
        this.verticalLine.isVisible = this.verticalLineVisible;
    }
}