import { createReferenceImageObject } from "../geometry/imageObject";
import { screenToWorld } from "../geometry/viewport";
import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { BaseTool } from "./BaseTool";
import type { ToolContext } from "./ToolContext";

class ImageTool extends BaseTool {
  constructor() {
    super({
      cursor: "default",
      id: "image",
      name: "Image",
    });
  }

  override activate(context: ToolContext): void {
    super.activate(context);

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
    input.style.display = "none";
    document.body.appendChild(input);

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
      useGeometryStore.getState().setActiveTool("select");
    };

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        return;
      }

      try {
        const src = await readFileAsDataUrl(file);
        const viewport = useViewportStore.getState().viewport;
        const center = screenToWorld(
          { x: viewport.width / 2, y: viewport.height / 2 },
          viewport,
        );

        const imageObject = createReferenceImageObject({
          mimeType: file.type || "application/octet-stream",
          name: file.name.replace(/\.[^.]+$/, "") || "Image",
          position: center,
          src,
        });

        const geometry = useGeometryStore.getState();
        if (geometry.addObject(imageObject)) {
          geometry.selectObject(imageObject.id);
        }
      } catch (_err) {
        // silently fail
      }

      cleanup();
    });

    input.addEventListener("cancel", () => {
      cleanup();
    });

    const onWindowFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          cleanup();
        }
        window.removeEventListener("focus", onWindowFocus);
      }, 300);
    };
    window.addEventListener("focus", onWindowFocus);

    input.click();
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const imageTool = new ImageTool();