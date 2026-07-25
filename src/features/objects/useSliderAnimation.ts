import { useEffect, useRef } from "react";
import { useGeometryStore } from "../../app/store/geometryStore";

export function useSliderAnimation() {
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = (time - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = time;

      // Only run if deltaTime is reasonable to prevent large jumps when tab is inactive
      if (deltaTime > 0 && deltaTime < 0.1) {
        const objects = useGeometryStore.getState().objects;
        
        for (const id in objects) {
          const obj = objects[id];
          if (!obj || obj.type !== "slider") continue;
          
          const slider = obj as import("../../core/geometry").SliderObject;
          if (slider.isAnimating) {
            const speed = slider.animationSpeed ?? 1;
            const direction = slider.animationDirection ?? 1;
            
            let newValue = slider.value + (speed * direction * deltaTime);
            let newDirection = direction as 1 | -1;
            
            // Check bounds and bounce
            if (newValue >= slider.max) {
              newValue = slider.max - (newValue - slider.max); // Bounce back
              newDirection = -1;
            } else if (newValue <= slider.min) {
              newValue = slider.min + (slider.min - newValue); // Bounce back
              newDirection = 1;
            }
            
            // Clamp strictly just in case
            newValue = Math.max(slider.min, Math.min(slider.max, newValue));
            
            // If the slider has a step that is significant, we still store the continuous value
            // and maybe let the renderer handle snapping? 
            // Actually, if it has a step, maybe we shouldn't snap during animation so it's smooth.
            
            useGeometryStore.getState().updateObject(id, (current) => ({
              ...current,
              value: newValue,
              animationDirection: newDirection,
              updatedAt: Date.now()
            }));
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
}
