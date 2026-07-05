import type { GeometryObject } from "../../core/geometry";
import { Readout, Section } from "./PropertyInspectorFields";

export function AdvancedPanel({ object }: { readonly object: GeometryObject }) {
  return (
    <Section title="Advanced">
      <Readout
        label="Dependencies"
        value={object.dependencies.length > 0 ? object.dependencies.join(", ") : "None"}
      />
      <Readout
        label="Dependents"
        value={object.dependents.length > 0 ? object.dependents.join(", ") : "None"}
      />
      <Readout
        label="Creation Time"
        value={object.createdAt ? new Date(object.createdAt).toLocaleString() : "Session seed"}
      />
      <Readout
        label="Object Metadata"
        value={object.metadata ? JSON.stringify(object.metadata) : "{}"}
      />
    </Section>
  );
}

