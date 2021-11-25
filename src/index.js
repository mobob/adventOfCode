"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hello = void 0;
const world = 'world';
function hello(world = `world`) {
    return `Hello ${world}! `;
}
exports.hello = hello;
console.log("oh ya...");
