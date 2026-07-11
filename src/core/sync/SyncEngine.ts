import type { GeometryObjectRecord } from "../geometry";
import type { TikzOptions } from "../tikz";
import {
  syncGeometryToTikz,
} from "./GeometryToTikzSync";
import {
  syncTikzToGeometry,
} from "./TikzToGeometrySync";
import type {
  GeometryToTikzSyncResult,
  TikzToGeometrySyncResult,
} from "./SyncTypes";

export type GeometryToTikzSyncInput = {
  readonly objects: GeometryObjectRecord;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
};

export type TikzToGeometrySyncInput = {
  readonly source: string;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
};

export class SyncEngine {
  syncGeometryToTikz(
    input: GeometryToTikzSyncInput,
  ): GeometryToTikzSyncResult {
    return syncGeometryToTikz(input);
  }

  syncTikzToGeometry(
    input: TikzToGeometrySyncInput,
  ): TikzToGeometrySyncResult {
    return syncTikzToGeometry(input);
  }
}

export const syncEngine = new SyncEngine();
