import { PlanSpec } from "../mock/planData";

/**
 * Generates an AutoCAD R12 ASCII DXF file content string for a given PlanSpec.
 * AC1009 (AutoCAD R12) is the most universally compatible DXF specification,
 * opening seamlessly in AutoCAD, LibreCAD, FreeCAD, Blender, and online CAD viewers.
 */
export function generatePlanDXF(spec: PlanSpec, zoneName: string): string {
  const lines: string[] = [];
  const plotW = spec.plotSize.w;
  const plotL = spec.plotSize.l;

  // Invert Y so standard CAD (Y is UP) matches SVG top-down orientation
  const toCadY = (y: number) => Number((plotL - y).toFixed(3));
  const toCadX = (x: number) => Number(x.toFixed(3));

  // 1. HEADER SECTION
  lines.push("0", "SECTION", "2", "HEADER");
  lines.push("9", "$ACADVER", "1", "AC1009");
  lines.push("9", "$EXTMIN", "10", "0.0", "20", "0.0", "30", "0.0");
  lines.push("9", "$EXTMAX", "10", String(plotW), "20", String(plotL), "30", "0.0");
  lines.push("0", "ENDSEC");

  // 2. TABLES SECTION (Layers with distinct colors)
  // Color 7 = White/Black, 1 = Red, 4 = Cyan, 2 = Yellow, 8 = Gray
  lines.push("0", "SECTION", "2", "TABLES");
  lines.push("0", "TABLE", "2", "LAYER", "70", "5");

  const layers = [
    { name: "WALLS", color: 7 },
    { name: "WINDOWS", color: 4 }, // Cyan
    { name: "DOORS", color: 1 },   // Red
    { name: "LABELS", color: 2 },  // Yellow
    { name: "PLOT", color: 8 },    // Gray
  ];

  for (const lyr of layers) {
    lines.push("0", "LAYER", "2", lyr.name, "70", "0", "62", String(lyr.color), "6", "CONTINUOUS");
  }

  lines.push("0", "ENDTAB");
  lines.push("0", "ENDSEC");

  // 3. BLOCKS SECTION (Required for R12 format)
  lines.push("0", "SECTION", "2", "BLOCKS");
  lines.push("0", "ENDSEC");

  // 4. ENTITIES SECTION
  lines.push("0", "SECTION", "2", "ENTITIES");

  const addLine = (layer: string, x1: number, y1: number, x2: number, y2: number) => {
    lines.push(
      "0", "LINE",
      "8", layer,
      "10", String(toCadX(x1)),
      "20", String(toCadY(y1)),
      "30", "0.0",
      "11", String(toCadX(x2)),
      "21", String(toCadY(y2)),
      "31", "0.0"
    );
  };

  const addText = (layer: string, x: number, y: number, height: number, text: string) => {
    lines.push(
      "0", "TEXT",
      "8", layer,
      "10", String(toCadX(x)),
      "20", String(toCadY(y)),
      "30", "0.0",
      "40", String(height),
      "1", text
    );
  };

  // Plot Boundary
  addLine("PLOT", 0, 0, plotW, 0);
  addLine("PLOT", plotW, 0, plotW, plotL);
  addLine("PLOT", plotW, plotL, 0, plotL);
  addLine("PLOT", 0, plotL, 0, 0);

  // Drawing Title Text
  addText("LABELS", 0.5, -0.8, 0.45, `ECOSHELTER CLIMATE PLAN - ZONE: ${zoneName.toUpperCase()}`);
  addText("LABELS", 0.5, -0.3, 0.28, `Scale: 1:100 (Meters) | North: ${spec.orientation} deg | Plot: ${plotW}m x ${plotL}m`);

  // Rooms
  for (const r of spec.rooms) {
    // 4 room perimeter walls
    addLine("WALLS", r.x, r.y, r.x + r.w, r.y);
    addLine("WALLS", r.x + r.w, r.y, r.x + r.w, r.y + r.l);
    addLine("WALLS", r.x + r.w, r.y + r.l, r.x, r.y + r.l);
    addLine("WALLS", r.x, r.y + r.l, r.x, r.y);

    // Room Label
    const cx = r.x + r.w / 2;
    const cy = r.y + r.l / 2;
    addText("LABELS", cx - 0.8, cy, 0.32, r.name);
    addText("LABELS", cx - 0.6, cy + 0.4, 0.22, `${r.w}m x ${r.l}m (${r.type})`);

    // Windows
    for (const w of r.windows) {
      if (w.orientation === "horizontal") {
        addLine("WINDOWS", w.x, w.y, w.x + w.width, w.y);
      } else {
        addLine("WINDOWS", w.x, w.y, w.x, w.y + w.width);
      }
    }

    // Doors
    for (const d of r.doors) {
      if (d.orientation === "horizontal") {
        addLine("DOORS", d.x, d.y, d.x + d.width, d.y);
        addLine("DOORS", d.x, d.y, d.x, d.y + d.width); // swing indicator line
      } else {
        addLine("DOORS", d.x, d.y, d.x, d.y + d.width);
        addLine("DOORS", d.x, d.y, d.x + d.width, d.y);
      }
    }
  }

  lines.push("0", "ENDSEC");
  lines.push("0", "EOF");

  return lines.join("\r\n");
}

/**
 * Triggers client-side browser download of a .dxf file.
 */
export function exportDxfFile(spec: PlanSpec, zoneKey: string) {
  const dxfString = generatePlanDXF(spec, zoneKey);
  const blob = new Blob([dxfString], { type: "application/dxf;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeZone = zoneKey.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const filename = `shelter-plan-${safeZone}.dxf`;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
