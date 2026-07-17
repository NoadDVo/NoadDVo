import { BaseTool } from "./BaseTool";

export class PanTool extends BaseTool {
  constructor() {
    super({
      cursor: "grab",
      id: "pan",
      name: "Pan Viewport",
      shortcut: "H",
    });
  }
}

export const panTool = new PanTool();
