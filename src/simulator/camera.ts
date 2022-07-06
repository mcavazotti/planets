import { Color } from "./color.js";
import { Marker } from "./input.js";
import { Planet } from "./planet.js";
import { Vector2 } from "./vector.js";
export class Camera {
    position: Vector2;
    renderTrail: boolean = true;
    renderHelp: boolean = false;
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
        const camRelativeOffset = cameraSpacePos.mult((new Vector2(this.frustrumWidth, this.frustrumHeight)).scale(1/this.zoom));
        return new Vector2(this.position.x + camRelativeOffset.x, this.position.y - camRelativeOffset.y);
    }

    clear() {
        this.canvasContext.clearRect(0, 0, this.canvasSize.x, this.canvasSize.y);
    }

    render(objects: Planet[], marker: Marker) {
        if (this.renderBg) {
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
} 