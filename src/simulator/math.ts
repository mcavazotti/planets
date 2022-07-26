import { Planet } from "./planet";
import { Vector2 } from "./vector";

const gravitationalConstant = 6.674 * 1e-11;
const elasticCoefficient = 0.95;

function randomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function gravitationalForce(obj1: Planet, obj2: Planet): Vector2 {
    var dir = obj2.position.sub(obj1.position);
    var distance = dir.length * 1000;
    var forceMagnitude = gravitationalConstant * obj1.mass * obj2.mass / (distance * distance);
    return dir.scale(forceMagnitude / distance);
}

export { randomInt, gravitationalForce, gravitationalConstant, elasticCoefficient }