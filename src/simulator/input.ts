import { Vector2 } from "./vector.js";

interface Marker {
    maxRadius: number;
    minRadius: number;
    maxDensity: number;
    minDensity: number;
    radius: number;
    density: number;
    position: Vector2;
    velocity: Vector2;
    direction: Vector2[];
    readyToCreate: boolean;
}

interface InputValues {
    mouseLeftDown: boolean;
    mouseMiddleDown: boolean;
    mouseRightDown: boolean;
    mousePos: Vector2;
    keysDown: Set<string>;
}

export { Marker, InputValues };