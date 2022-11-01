import { Color } from "./color";
import { Marker } from "./input";
import { Planet } from "./planet";
import { SimData } from "./sim-data";
import { Vector2 } from "./vector";
export class Camera {
    position: Vector2;
    renderTrail: boolean = true;
    renderHelp: boolean = true;
    renderBg: boolean = true;
    renderUI: boolean = true;
    frustrumWidth: number = 1000;
    frustrumHeight: number;
    aspectRatio: number;
    zoom: number = 1;
    maxZoom: number = 5;
    minZoom: number = 0.1;
    bgColor: Color = new Color('#040252');

    canvasSize: Vector2;
    canvasElement: HTMLCanvasElement;
    canvasContext: CanvasRenderingContext2D;

    constructor(element: HTMLCanvasElement, position: Vector2, renderUi: boolean = true, renderBg: boolean = true) {
        this.position = position;
        this.canvasElement = element;
        this.canvasContext = this.canvasElement.getContext("2d")!;
        this.renderUI = renderUi;
        this.renderBg = renderBg;

        const pixelRatio = window.devicePixelRatio || 1;
        // this.canvasSize = new Vector2(pixelRatio * this.canvasElement.clientWidth, pixelRatio * this.canvasElement.clientHeight);
        this.canvasSize = new Vector2(this.canvasElement.width, this.canvasElement.height);
        this.aspectRatio = this.canvasSize.y / this.canvasSize.x;
        this.frustrumHeight = this.frustrumWidth * this.aspectRatio;
    }

    convertWorldCoordToRaster(coord: Vector2): Vector2 {
        const camRelativeOffset = this.position.sub(coord);
        const camSpacePos = camRelativeOffset.div((new Vector2(this.frustrumWidth, this.frustrumHeight)).scale(1 / this.zoom));
        return new Vector2(this.canvasSize.x / 2 - (camSpacePos.x * this.canvasSize.x / 2), this.canvasSize.y / 2 + (camSpacePos.y * this.canvasSize.y / 2));
    }

    convertRasterCoordToWorld(coord: Vector2): Vector2 {
        const cameraSpacePos = new Vector2((coord.x - this.canvasSize.x / 2) / (this.canvasSize.x / 2), (coord.y - this.canvasSize.y / 2) / (this.canvasSize.y / 2));
        const camRelativeOffset = cameraSpacePos.mult((new Vector2(this.frustrumWidth, this.frustrumHeight)).scale(1 / this.zoom));
        return new Vector2(this.position.x + camRelativeOffset.x, this.position.y - camRelativeOffset.y);
    }

    clear() {
        this.canvasContext.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    render(objects: Planet[], marker: Marker, simData: SimData) {
        if (this.renderBg) {
            console.log("renderBG")
            this.canvasContext.fillStyle = this.bgColor.hex;
            this.canvasContext.fillRect(0, 0, this.canvasSize.x, this.canvasSize.y);
        }
        for (const planet of objects) {
            if (this.renderTrail) {
                this.renderSegments(planet.trail, planet.color);
            }
            this.renderCircle(planet.position, planet.radius, planet.color);
        }

        if (this.renderUI) {
            this.renderSegments(marker.direction, new Color('#ff3838aa'));
            this.renderCircle(marker.position, marker.radius, new Color('#ff3838aa'));
            this.helpMessage(simData.bounce);

            this.canvasContext.fillStyle = '#ffffffcc';
            this.canvasContext.font = 'bold 16px Courier New';
            this.canvasContext.fillText("New object info", 20, this.canvasSize.y - 35);
            this.canvasContext.font = '14px Courier New';
            this.canvasContext.fillText("Radius: " + marker.radius.toPrecision(4) + " km", 20, this.canvasSize.y - 20);
            this.canvasContext.fillText("Density: " + marker.density.toPrecision(4) + " kg/m^3", 20, this.canvasSize.y - 10);
        }
        if (simData.paused) {
            this.canvasContext.fillStyle = '#ffffffcc';
            this.canvasContext.font = 'bold 20px Courier New';
            this.canvasContext.fillText("Paused", this.canvasSize.x - 100, 30)
        }
    }

    private renderSegments(segments: Vector2[], color: Color) {
        if (segments.length) {
            let transformedSegments = segments.map((p) => this.convertWorldCoordToRaster(p));
            this.canvasContext.strokeStyle = color.hex;

            this.canvasContext.beginPath();
            this.canvasContext.moveTo(transformedSegments[0].x, transformedSegments[0].y);
            for (const point of transformedSegments) {
                this.canvasContext.lineTo(point.x, point.y);
            }
            this.canvasContext.stroke();
        }
    }
    private renderCircle(position: Vector2, radius: number, color: Color) {
        let v1 = this.convertWorldCoordToRaster(new Vector2(radius, 0));
        let v2 = this.convertWorldCoordToRaster(new Vector2());
        const realRadius = v1.sub(v2).length;
        const transformedCenter = this.convertWorldCoordToRaster(position);

        this.canvasContext.fillStyle = color.hex;
        this.canvasContext.beginPath();
        this.canvasContext.arc(transformedCenter.x, transformedCenter.y, realRadius, 0, 2 * Math.PI);
        this.canvasContext.fill();
    }

    private helpMessage(bounce?: boolean) {
        var controls = [
            "<comma>/<period>           speed up/down simulation",
            "<left click> + drag        create object",
            "<T>                        toggle " + (this.renderTrail ? "off" : "on") + " trail",
            "<P>                        pause simulation",
            "<Q>                        reset camera position",
            "<R>                        reset simulation",
            "<W>/<A>/<S>/<D>            move camera",
            "<Z> + scroll               change radius of new object",
            "<X> + scroll               change density of new object",
            "<C>                        reset radius and density",
            "<B>                        toggle bounce " + (bounce ? "off" : "on"),
            "<H>                        hide Controls",
        ];

        this.canvasContext.fillStyle = '#ffffffcc';
        if (this.renderHelp) {
            this.canvasContext.font = 'bold 18px Courier New';
            this.canvasContext.fillText("Controls:", 10, 20);
            this.canvasContext.font = 'lighter 13px Courier New';
            for (let i = 0; i < controls.length; i++) {
                this.canvasContext.fillText(controls[i], 10, 35 + i * 15)
            }
        } else {
            this.canvasContext.font = 'lighter 11px Courier New';
            this.canvasContext.fillText("Press <H> to show Controls", 10, 20);
        }
    }
} 