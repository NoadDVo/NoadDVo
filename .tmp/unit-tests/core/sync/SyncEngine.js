"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEngine = exports.SyncEngine = void 0;
const GeometryToTikzSync_1 = require("./GeometryToTikzSync");
const TikzToGeometrySync_1 = require("./TikzToGeometrySync");
class SyncEngine {
    syncGeometryToTikz(input) {
        return (0, GeometryToTikzSync_1.syncGeometryToTikz)(input);
    }
    syncTikzToGeometry(input) {
        return (0, TikzToGeometrySync_1.syncTikzToGeometry)(input);
    }
}
exports.SyncEngine = SyncEngine;
exports.syncEngine = new SyncEngine();
