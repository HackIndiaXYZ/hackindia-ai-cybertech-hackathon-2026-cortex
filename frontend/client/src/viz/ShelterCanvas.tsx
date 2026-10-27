import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  ActiveClimateArchetype,
  CLIMATE_SHELTER_CONFIGS,
  ClimateFeatureAnnotation,
} from "./climateShelterData";
import type { PlanSpec } from "../mock/planData";
import type { DesignSpecResponse } from "../services/analyzeService";

export interface ShelterCanvasProps {
  climateZone?: ActiveClimateArchetype;
  timeOfDay: number; // 6 to 18
  month: number; // 0 to 11
  viewMode?: "exterior" | "cutaway";
  zoneColor?: string;
  onSelectFeature?: (feature: ClimateFeatureAnnotation | null) => void;
  spec?: PlanSpec | DesignSpecResponse;
}

// -------------------------------------------------------------
// Interactive 3D Feature Pin
// -------------------------------------------------------------
function FeaturePin({
  feature,
  accentColor,
  active,
  onClick,
}: {
  feature: ClimateFeatureAnnotation;
  accentColor: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y =
        feature.position[1] + Math.sin(clock.getElapsedTime() * 3 + feature.position[0]) * 0.08;
    }
  });

  return (
    <group position={feature.position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={active || hovered ? "#F59E0B" : accentColor}
          emissive={active || hovered ? "#F59E0B" : accentColor}
          emissiveIntensity={active || hovered ? 0.9 : 0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[0.26, 0.32, 24]} />
        <meshBasicMaterial
          color={active || hovered ? "#F59E0B" : accentColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML Annotation Label */}
      <Html
        position={[0, 0.4, 0]}
        center
        distanceFactor={18}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            background: active ? "rgba(15, 23, 42, 0.95)" : "rgba(15, 23, 42, 0.8)",
            color: "#ffffff",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            border: `1px solid ${active ? "#F59E0B" : "rgba(255,255,255,0.2)"}`,
            backdropFilter: "blur(4px)",
            transform: `scale(${hovered || active ? 1.08 : 1})`,
            transition: "transform 0.15s ease, background 0.15s ease",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: active ? "#F59E0B" : accentColor,
            }}
          />
          {feature.title}
        </div>
      </Html>
    </group>
  );
}

// -------------------------------------------------------------
// Real-time Sun Lighting
// -------------------------------------------------------------
function SunLight({ timeOfDay, month }: { timeOfDay: number; month: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const hourAngle = ((timeOfDay - 6) / 12) * Math.PI;
    const monthAltitude = Math.sin((month / 11) * Math.PI) * 15;
    const radius = 35;
    const x = Math.cos(hourAngle) * radius;
    const y = Math.max(0.5, Math.sin(hourAngle) * radius) + monthAltitude;
    const z = Math.sin(hourAngle) * radius * 0.6;

    lightRef.current.position.set(x, y, z);

    let intensity = 0.2;
    if (timeOfDay >= 6 && timeOfDay <= 18) {
      intensity = 0.4 + Math.sin(((timeOfDay - 6) / 12) * Math.PI) * 1.8;
    }
    lightRef.current.intensity = intensity;

    if (timeOfDay < 7.5 || timeOfDay > 16.5) {
      lightRef.current.color.setHex(0xff9944); // Golden hour
    } else {
      lightRef.current.color.setHex(0xfff8ee); // Crisp daylight
    }
  });

  return (
    <>
      <ambientLight intensity={0.55} color="#dbeafe" />
      <directionalLight
        ref={lightRef}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />
    </>
  );
}

// -------------------------------------------------------------
// Procedural Climate-Specific Shelter Building
// -------------------------------------------------------------
function ClimateShelterModel({
  zone,
  viewMode,
  selectedFeature,
  onSelectFeature,
  spec,
}: {
  zone: ActiveClimateArchetype;
  viewMode: "exterior" | "cutaway";
  selectedFeature: string | null;
  onSelectFeature: (f: ClimateFeatureAnnotation | null) => void;
  spec?: PlanSpec | DesignSpecResponse;
}) {
  const config = CLIMATE_SHELTER_CONFIGS[zone] || CLIMATE_SHELTER_CONFIGS.TEMPERATE;
  const isCutaway = viewMode === "cutaway";

  // Elevation offset if stilted
  const isStilted = zone === "WARM_HUMID";
  const stiltHeight = isStilted ? 1.6 : 0;
  const floorY = stiltHeight + 0.15;
  const wallHeight = 2.8;
  const ceilingY = floorY + wallHeight;
  const roofY = isCutaway ? ceilingY + 3.2 : ceilingY; // Lifts up in cutaway view

  // Dynamic footprint derived from spec if provided
  const rawW = spec?.plotSize?.w ?? 14.0;
  const rawL = spec?.plotSize?.l ?? 16.0;
  const buildingW = Math.max(7.5, Math.min(10.5, rawW * 0.62));
  const buildingL = Math.max(6.0, Math.min(9.0, rawL * 0.48));

  return (
    <group position={[0, 0, 0]}>
      {/* ---------------- GROUND / TERRAIN ---------------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial
          color={config.groundColor}
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Decorative Ground Ring / Footprint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[buildingW * 0.7, buildingW * 0.72, 48]} />
        <meshBasicMaterial color="#94A3B8" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* ---------------- STILTS / PILOTIS (Warm-Humid / Flood) ---------------- */}
      {isStilted && (
        <group>
          {/* 12 Stilt Columns */}
          {[-3.8, -1.3, 1.3, 3.8].map((sx) =>
            [-2.8, 0, 2.8].map((sz) => (
              <group key={`stilt-${sx}-${sz}`} position={[sx, stiltHeight / 2, sz]}>
                {/* Timber / Concrete Post */}
                <mesh castShadow receiveShadow>
                  <cylinderGeometry args={[0.16, 0.18, stiltHeight, 16]} />
                  <meshStandardMaterial color="#4A3728" roughness={0.8} />
                </mesh>
                {/* Concrete Footing on Ground */}
                <mesh position={[0, -stiltHeight / 2 + 0.1, 0]} castShadow>
                  <boxGeometry args={[0.5, 0.2, 0.5]} />
                  <meshStandardMaterial color="#64748B" roughness={0.9} />
                </mesh>
              </group>
            ))
          )}

          {/* Wooden Deck Under-Framing Beams */}
          {[-2.8, 0, 2.8].map((bz, i) => (
            <mesh key={`beam-x-${i}`} position={[0, stiltHeight - 0.1, bz]} castShadow>
              <boxGeometry args={[buildingW + 0.6, 0.2, 0.25]} />
              <meshStandardMaterial color="#3E2723" roughness={0.8} />
            </mesh>
          ))}

          {/* Entrance Stairs leading to elevated deck */}
          <group position={[0, 0, buildingL / 2 + 0.8]}>
            {[0, 1, 2, 3, 4].map((step) => {
              const stepY = (step / 5) * stiltHeight;
              const stepZ = (1 - step / 5) * 1.5;
              return (
                <mesh key={`step-${step}`} position={[0, stepY + 0.08, stepZ]} castShadow receiveShadow>
                  <boxGeometry args={[1.6, 0.15, 0.35]} />
                  <meshStandardMaterial color="#5D4037" roughness={0.7} />
                </mesh>
              );
            })}
            {/* Stair Railing */}
            <mesh position={[-0.8, stiltHeight * 0.6, 0.7]} rotation={[0.55, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 2.0, 8]} />
              <meshStandardMaterial color="#3E2723" />
            </mesh>
            <mesh position={[0.8, stiltHeight * 0.6, 0.7]} rotation={[0.55, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 2.0, 8]} />
              <meshStandardMaterial color="#3E2723" />
            </mesh>
          </group>
        </group>
      )}

      {/* ---------------- COLD CLIMATE STONE BASE PLINTH ---------------- */}
      {zone === "COLD" && (
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[buildingW + 0.4, 0.5, buildingL + 0.4]} />
          <meshStandardMaterial color="#334155" roughness={0.95} />
        </mesh>
      )}

      {/* ---------------- MAIN FLOOR SLAB / DECK ---------------- */}
      <mesh position={[0, floorY, 0]} receiveShadow castShadow>
        <boxGeometry args={[buildingW + (isStilted ? 1.2 : 0.4), 0.25, buildingL + (isStilted ? 1.2 : 0.4)]} />
        <meshStandardMaterial
          color={isStilted ? "#795548" : zone === "HOT_DRY" ? "#C29B70" : "#CBD5E1"}
          roughness={0.7}
        />
      </mesh>

      {/* ---------------- MAIN EXTERIOR WALLS ---------------- */}
      <group position={[0, floorY + wallHeight / 2, 0]}>
        {/* North Wall (Back) */}
        <mesh position={[0, 0, -buildingL / 2]} castShadow receiveShadow>
          <boxGeometry args={[buildingW, wallHeight, 0.25]} />
          <meshStandardMaterial color={config.wallColor} roughness={0.8} />
        </mesh>

        {/* South Wall (Front) with Main Entrance & Glazing */}
        <group position={[0, 0, buildingL / 2]}>
          {/* Left wall section */}
          <mesh position={[-2.8, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, wallHeight, 0.25]} />
            <meshStandardMaterial color={config.wallColor} roughness={0.8} />
          </mesh>
          {/* Right wall section */}
          <mesh position={[2.8, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, wallHeight, 0.25]} />
            <meshStandardMaterial color={config.wallColor} roughness={0.8} />
          </mesh>
          {/* Header above door */}
          <mesh position={[0, wallHeight / 2 - 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.7, 0.25]} />
            <meshStandardMaterial color={config.wallColor} roughness={0.8} />
          </mesh>

          {/* Door Frame & Door */}
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[1.5, 2.1, 0.1]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
          {/* Door Handle */}
          <mesh position={[0.55, -0.3, 0.08]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* West Wall (Left) */}
        <mesh position={[-buildingW / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, wallHeight, buildingL]} />
          <meshStandardMaterial color={config.wallColor} roughness={0.8} />
        </mesh>

        {/* East Wall (Right) */}
        <mesh position={[buildingW / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, wallHeight, buildingL]} />
          <meshStandardMaterial color={config.wallColor} roughness={0.8} />
        </mesh>
      </group>

      {/* ---------------- CLIMATE SPECIFIC ARCHITECTURAL ELEMENTS ---------------- */}

      {/* 1. COLD CLIMATE: Trombe Glazing & Stone Chimney */}
      {zone === "COLD" && (
        <group>
          {/* High Solar Gain Windows on South Wall */}
          {[-2.8, 2.8].map((wx, i) => (
            <group key={`cold-win-${i}`} position={[wx, floorY + wallHeight * 0.55, buildingL / 2 + 0.02]}>
              {/* Glass Pane */}
              <mesh castShadow>
                <boxGeometry args={[2.0, 1.6, 0.06]} />
                <meshStandardMaterial
                  color="#38BDF8"
                  transparent
                  opacity={0.65}
                  roughness={0.1}
                  metalness={0.9}
                />
              </mesh>
              {/* Timber Frame */}
              <mesh position={[0, 0, -0.01]}>
                <boxGeometry args={[2.1, 1.7, 0.12]} />
                <meshStandardMaterial color="#1E293B" roughness={0.5} />
              </mesh>
            </group>
          ))}

          {/* Heavy Stone Chimney */}
          <group position={[2.5, floorY + wallHeight + 1.6, -1]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.9, 3.8, 0.9]} />
              <meshStandardMaterial color="#334155" roughness={0.95} />
            </mesh>
            {/* Chimney Cap */}
            <mesh position={[0, 2.0, 0]} castShadow>
              <boxGeometry args={[1.2, 0.15, 1.2]} />
              <meshStandardMaterial color="#1E293B" roughness={0.5} />
            </mesh>
          </group>

          {/* Airlock Front Vestibule Porch */}
          <group position={[0, floorY + 1.1, buildingL / 2 + 0.9]}>
            {/* Vestibule Rooflet */}
            <mesh position={[0, 1.3, 0]} rotation={[0.2, 0, 0]} castShadow>
              <boxGeometry args={[2.4, 0.12, 1.6]} />
              <meshStandardMaterial color="#1E293B" roughness={0.4} />
            </mesh>
            {/* Support Posts */}
            <mesh position={[-1.0, 0, 0.6]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 2.4, 12]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[1.0, 0, 0.6]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 2.4, 12]} />
              <meshStandardMaterial color="#475569" />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. HOT-DRY CLIMATE: Badgir Windcatcher Tower & Courtyard */}
      {zone === "HOT_DRY" && (
        <group>
          {/* Badgir Natural Windcatcher Tower */}
          <group position={[buildingW / 2 - 1.4, ceilingY + 1.8, -buildingL / 2 + 1.4]}>
            {/* Tower Shaft */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.8, 3.6, 1.8]} />
              <meshStandardMaterial color="#D4A373" roughness={0.9} />
            </mesh>
            {/* Wind Scoop Louvers / Vents (Openings on 4 sides) */}
            <mesh position={[0, 1.2, 0.92]} castShadow>
              <boxGeometry args={[1.3, 0.8, 0.08]} />
              <meshStandardMaterial color="#5C3D2E" roughness={0.7} />
            </mesh>
            <mesh position={[0, 1.2, -0.92]} castShadow>
              <boxGeometry args={[1.3, 0.8, 0.08]} />
              <meshStandardMaterial color="#5C3D2E" roughness={0.7} />
            </mesh>
            {/* Tower Cornice Cap */}
            <mesh position={[0, 1.9, 0]} castShadow>
              <boxGeometry args={[2.1, 0.2, 2.1]} />
              <meshStandardMaterial color="#BC6C25" roughness={0.8} />
            </mesh>
          </group>

          {/* Central Open Courtyard Perforations */}
          <group position={[0, floorY + 0.1, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[2.6, 0.05, 2.6]} />
              <meshStandardMaterial color="#38BDF8" roughness={0.2} metalness={0.7} />
            </mesh>
            {/* Courtyard Planter / Border */}
            <mesh position={[0, 0.15, 0]}>
              <ringGeometry args={[1.3, 1.45, 4]} />
              <meshStandardMaterial color="#D4A373" />
            </mesh>
          </group>

          {/* Deep-Set Small Jharokha Windows (Shielded from direct sun) */}
          {[-2.8, 2.8].map((wx, i) => (
            <group key={`hotdry-win-${i}`} position={[wx, floorY + wallHeight * 0.55, buildingL / 2 + 0.05]}>
              {/* Recessed Frame */}
              <mesh castShadow>
                <boxGeometry args={[1.1, 1.1, 0.4]} />
                <meshStandardMaterial color="#BC6C25" roughness={0.8} />
              </mesh>
              {/* Shading Hood */}
              <mesh position={[0, 0.65, 0.1]} rotation={[0.3, 0, 0]} castShadow>
                <boxGeometry args={[1.3, 0.1, 0.35]} />
                <meshStandardMaterial color="#8C5226" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* 3. WARM-HUMID / FLOOD: Louvers & Shaded Veranda */}
      {zone === "WARM_HUMID" && (
        <group>
          {/* Wraparound Veranda Railings */}
          <group position={[0, floorY + 0.5, buildingL / 2 + 0.55]}>
            <mesh castShadow>
              <boxGeometry args={[buildingW + 1.0, 0.08, 0.08]} />
              <meshStandardMaterial color="#3E2723" />
            </mesh>
            {/* Slats */}
            {[-4.2, -3.0, -1.8, 1.8, 3.0, 4.2].map((sx) => (
              <mesh key={`rail-${sx}`} position={[sx, -0.22, 0]} castShadow>
                <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
                <meshStandardMaterial color="#5D4037" />
              </mesh>
            ))}
          </group>

          {/* Horizontal Ventilation Louvers on West & East Walls */}
          {[-buildingW / 2 - 0.02, buildingW / 2 + 0.02].map((lx, idx) => (
            <group key={`louver-wall-${idx}`} position={[lx, floorY + wallHeight * 0.6, 0]}>
              {[0, 1, 2, 3, 4].map((slat) => (
                <mesh
                  key={`slat-${slat}`}
                  position={[0, (slat - 2) * 0.25, 0]}
                  rotation={[0, 0, idx === 0 ? -0.35 : 0.35]}
                  castShadow
                >
                  <boxGeometry args={[0.15, 0.05, buildingL * 0.6]} />
                  <meshStandardMaterial color="#5D4037" roughness={0.7} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 4. TEMPERATE / MODERATE: Solar Monopitch, Pergola Trellis, Cistern */}
      {zone === "TEMPERATE" && (
        <group>
          {/* Wooden Pergola Trellis on South/West */}
          <group position={[-buildingW / 2 - 1.2, floorY + 1.4, 0]}>
            {/* Upright posts */}
            <mesh position={[0, 0, -2.5]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 2.8, 10]} />
              <meshStandardMaterial color="#78350F" />
            </mesh>
            <mesh position={[0, 0, 2.5]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 2.8, 10]} />
              <meshStandardMaterial color="#78350F" />
            </mesh>
            {/* Overhead Rafters */}
            {[-2.2, -1.1, 0, 1.1, 2.2].map((rz) => (
              <mesh key={`raf-${rz}`} position={[0.6, 1.4, rz]} castShadow>
                <boxGeometry args={[2.0, 0.1, 0.08]} />
                <meshStandardMaterial color="#92400E" />
              </mesh>
            ))}
          </group>

          {/* Rainwater Harvesting Cylindrical Cistern Tank */}
          <group position={[buildingW / 2 + 0.9, floorY + 0.8, -buildingL / 2 + 1.2]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.65, 0.65, 1.6, 24]} />
              <meshStandardMaterial color="#047857" roughness={0.4} metalness={0.2} />
            </mesh>
            {/* Downspout Pipe from Roof */}
            <mesh position={[-0.45, 1.2, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.8, 12]} />
              <meshStandardMaterial color="#94A3B8" metalness={0.8} />
            </mesh>
          </group>
        </group>
      )}

      {/* 5. COMPOSITE / VARIABLE: Operable Brise-Soleil Vertical Shading Fins */}
      {zone === "COMPOSITE" && (
        <group position={[0, floorY + wallHeight * 0.55, buildingL / 2 + 0.25]}>
          {[-3.2, -2.4, -1.6, 1.6, 2.4, 3.2].map((bx) => (
            <mesh key={`fin-${bx}`} position={[bx, 0, 0]} rotation={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.05, 1.8, 0.4]} />
              <meshStandardMaterial color="#B45309" roughness={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {/* ---------------- ROOF ARCHITECTURE (CLIMATE ADAPTIVE) ---------------- */}
      <group position={[0, roofY, 0]}>
        {/* A. STEEP GABLE ROOF (Cold Climate: High Snow Shedding) */}
        {zone === "COLD" && (
          <group>
            {/* Left Pitch (West side) */}
            <mesh
              position={[-buildingW / 4, 1.5, 0]}
              rotation={[0, 0, -0.68]} // ~39 degrees
              castShadow
              receiveShadow
            >
              <boxGeometry args={[buildingW * 0.68, 0.22, buildingL + 0.8]} />
              <meshStandardMaterial
                color={config.roofColor}
                roughness={0.3}
                metalness={0.6}
              />
            </mesh>

            {/* Right Pitch (East side) */}
            <mesh
              position={[buildingW / 4, 1.5, 0]}
              rotation={[0, 0, 0.68]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[buildingW * 0.68, 0.22, buildingL + 0.8]} />
              <meshStandardMaterial
                color={config.roofColor}
                roughness={0.3}
                metalness={0.6}
              />
            </mesh>

            {/* Ridge Cap Apex */}
            <mesh position={[0, 3.1, 0]} castShadow>
              <boxGeometry args={[0.4, 0.15, buildingL + 0.9]} />
              <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Front & Back Gable Triangular Wall Infills */}
            {[-buildingL / 2, buildingL / 2].map((gz) => (
              <mesh key={`gable-${gz}`} position={[0, 1.3, gz]} castShadow>
                <coneGeometry args={[buildingW / 2, 2.6, 4]} />
                <meshStandardMaterial color={config.wallColor} roughness={0.8} />
              </mesh>
            ))}
          </group>
        )}

        {/* B. PARAPET & TERRACE ROOF (Hot-Dry: Reflective & Night-Cooling Terrace) */}
        {zone === "HOT_DRY" && (
          <group>
            {/* Flat Reflective Roof Deck */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[buildingW + 0.4, 0.2, buildingL + 0.4]} />
              <meshStandardMaterial color="#E2D9C8" roughness={0.6} />
            </mesh>

            {/* 0.6m High Perimeter Parapet Walls */}
            {/* North & South Parapets */}
            <mesh position={[0, 0.5, -buildingL / 2]} castShadow>
              <boxGeometry args={[buildingW + 0.4, 0.6, 0.25]} />
              <meshStandardMaterial color="#BC6C25" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, buildingL / 2]} castShadow>
              <boxGeometry args={[buildingW + 0.4, 0.6, 0.25]} />
              <meshStandardMaterial color="#BC6C25" roughness={0.8} />
            </mesh>
            {/* West & East Parapets */}
            <mesh position={[-buildingW / 2, 0.5, 0]} castShadow>
              <boxGeometry args={[0.25, 0.6, buildingL + 0.4]} />
              <meshStandardMaterial color="#BC6C25" roughness={0.8} />
            </mesh>
            <mesh position={[buildingW / 2, 0.5, 0]} castShadow>
              <boxGeometry args={[0.25, 0.6, buildingL + 0.4]} />
              <meshStandardMaterial color="#BC6C25" roughness={0.8} />
            </mesh>

            {/* Central Courtyard Roof Opening Rim */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[2.8, 0.4, 2.8]} />
              <meshStandardMaterial color="#8C5226" roughness={0.8} />
            </mesh>
          </group>
        )}

        {/* C. HIPPED DEEP EAVES ROOF (Warm-Humid: Monsoon Rain Runoff & Shading) */}
        {zone === "WARM_HUMID" && (
          <group>
            {/* 4-Sided Sloping Hipped Roof with dramatic 1.6m overhangs */}
            <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
              <coneGeometry args={[buildingW * 0.75, 2.6, 4]} />
              <meshStandardMaterial
                color={config.roofColor}
                roughness={0.5}
                metalness={0.1}
              />
            </mesh>
            {/* Extended Eaves Fascia Board */}
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[buildingW + 2.8, 0.15, buildingL + 2.8]} />
              <meshStandardMaterial color="#1B4332" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* D. MONOPITCH SOLAR ROOF (Temperate: PV Electricity Harvest) */}
        {zone === "TEMPERATE" && (
          <group>
            {/* Angled Single-Slope (Shed) Roof tilted South */}
            <group position={[0, 0.9, 0]} rotation={[0.35, 0, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[buildingW + 1.2, 0.2, buildingL + 1.2]} />
                <meshStandardMaterial color="#1E293B" roughness={0.4} />
              </mesh>

              {/* 8 Dark-Blue Photovoltaic Solar Panels */}
              {[-3.0, -1.0, 1.0, 3.0].map((px) =>
                [-1.5, 1.5].map((pz) => (
                  <group key={`pv-${px}-${pz}`} position={[px, 0.12, pz]}>
                    <mesh castShadow>
                      <boxGeometry args={[1.7, 0.04, 2.4]} />
                      <meshStandardMaterial
                        color="#0F172A"
                        metalness={0.9}
                        roughness={0.15}
                      />
                    </mesh>
                    {/* Aluminum Silver Panel Frame */}
                    <mesh position={[0, 0.02, 0]}>
                      <boxGeometry args={[1.75, 0.02, 2.45]} />
                      <meshStandardMaterial color="#94A3B8" metalness={0.8} />
                    </mesh>
                  </group>
                ))
              )}
            </group>

            {/* High Clerestory Window Strip along Apex */}
            <mesh position={[0, 0.8, -buildingL / 2]} castShadow>
              <boxGeometry args={[buildingW * 0.8, 0.6, 0.1]} />
              <meshStandardMaterial
                color="#38BDF8"
                transparent
                opacity={0.7}
                roughness={0.1}
                metalness={0.8}
              />
            </mesh>
          </group>
        )}

        {/* E. COMPOSITE HYBRID ROOF */}
        {zone === "COMPOSITE" && (
          <group>
            {/* Left High Solar Wing */}
            <group position={[-buildingW / 4, 1.0, 0]} rotation={[0, 0, -0.2]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[buildingW * 0.55, 0.2, buildingL + 0.8]} />
                <meshStandardMaterial color="#334155" roughness={0.4} />
              </mesh>
              {/* PV Panel Array on Left Wing */}
              {[-1.2, 1.2].map((px) => (
                <mesh key={`comp-pv-${px}`} position={[px, 0.12, 0]} castShadow>
                  <boxGeometry args={[1.8, 0.04, 4.0]} />
                  <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.1} />
                </mesh>
              ))}
            </group>

            {/* Right Terrace Roof Wing with Shaded Pergola */}
            <mesh position={[buildingW / 4, 0.2, 0]} castShadow receiveShadow>
              <boxGeometry args={[buildingW * 0.55, 0.2, buildingL + 0.8]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* ---------------- 3D FEATURE ANNOTATION PINS ---------------- */}
      {config.features.map((feat) => (
        <FeaturePin
          key={feat.id}
          feature={feat}
          accentColor={config.accentColor}
          active={selectedFeature === feat.id}
          onClick={() => onSelectFeature(selectedFeature === feat.id ? null : feat)}
        />
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Main Canvas Component
// -------------------------------------------------------------
export default function ShelterCanvas({
  climateZone = "TEMPERATE",
  timeOfDay,
  month,
  viewMode = "exterior",
  onSelectFeature,
  spec,
}: ShelterCanvasProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const handleSelect = (feat: ClimateFeatureAnnotation | null) => {
    setActiveFeature(feat ? feat.id : null);
    if (onSelectFeature) {
      onSelectFeature(feat);
    }
  };

  return (
    <Canvas
      shadows
      camera={{ position: [14, 11, 15], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#0f172a"]} />

      <SunLight timeOfDay={timeOfDay} month={month} />
      <Environment preset="city" />

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        minDistance={6}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />

      <ClimateShelterModel
        zone={climateZone}
        viewMode={viewMode}
        selectedFeature={activeFeature}
        onSelectFeature={handleSelect}
        spec={spec}
      />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.5}
        scale={28}
        blur={2.5}
        far={12}
      />
    </Canvas>
  );
}
