import { Color } from "./color.js";
import { Vector2 } from "./vector.js";

export class Planet {
    name: string;
    mass: number;
    density: number;
    radius: number;
    position: Vector2;
    velocity: Vector2;
    trail: Vector2[] = [];
    color: Color;
    markedForDeletion: boolean = false;

    constructor(position: Vector2, radiusInKm: number, density: number, velocity: Vector2, color: Color, name: string = '') {
        const radiusInM = radiusInKm * 1000;
        const cubicR = radiusInM * radiusInM * radiusInM;
        const volume = 4 * Math.PI * cubicR / 3;

        this.mass = density * volume;
        this.density = density;
        this.position = position.copy();
        this.radius = radiusInKm;
        this.velocity = velocity;
        this.name = name;
        this.color = color;
    }
}