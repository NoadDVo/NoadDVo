"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = assert;
exports.assertEqual = assertEqual;
exports.assertIncludes = assertIncludes;
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}
function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}. Expected ${String(expected)}, got ${String(actual)}.`);
    }
}
function assertIncludes(actual, expected, message) {
    if (!actual.includes(expected)) {
        throw new Error(`${message}. Missing ${expected}.`);
    }
}
