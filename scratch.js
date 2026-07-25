const idMap = new Map([
  ["point-1", "point-paste-1"],
  ["point-2", "point-paste-2"],
  ["circle-1", "circle-paste-1"],
]);

function remapValue(value, idMap) {
  if (typeof value === "string") {
    if (idMap.has(value)) {
      return idMap.get(value);
    }
    const colonIndex = value.indexOf(":");
    if (colonIndex !== -1) {
      const baseId = value.substring(0, colonIndex);
      if (idMap.has(baseId)) {
        return `${idMap.get(baseId)}${value.substring(colonIndex)}`;
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => remapValue(item, idMap));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, remapValue(entry, idMap)]),
    );
  }
  return value;
}

const obj = {
  id: "circle-1",
  type: "circle",
  dependencies: ["point-1", "point-2"],
  style: {
    stroke: "#3b82f6",
    strokeWidth: 2,
    fill: "#7ddcff",
    fillOpacity: 0.22,
  },
};

console.log(JSON.stringify(remapValue(JSON.parse(JSON.stringify(obj)), idMap), null, 2));
