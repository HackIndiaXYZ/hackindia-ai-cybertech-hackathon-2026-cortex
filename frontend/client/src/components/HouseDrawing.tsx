/**
 * HouseDrawing
 * ------------------------------------------------------------------
 * SVG line-art house silhouette that:
 *  1. Draws itself via stroke-dashoffset animation on mount
 *  2. Softly fills in after the stroke completes
 *  3. Respects prefers-reduced-motion (shows filled immediately)
 * ------------------------------------------------------------------
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface HouseDrawingProps {
  /** Overall width. Height scales proportionally. */
  width?: number;
  /** Delay before animation starts (ms) */
  delay?: number;
  /** CSS colour for stroke + fill. Defaults to currentColor */
  strokeColor?: string;
  fillColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export default function HouseDrawing({
  width = 320,
  delay = 300,
  strokeColor = "rgba(200,85,61,0.85)",
  fillColor   = "rgba(200,85,61,0.10)",
  style,
  className,
}: HouseDrawingProps) {
  const reduced = useReducedMotion();
  const svgRef  = useRef<SVGSVGElement>(null);

  const H = width * 0.68;

  useEffect(() => {
    if (reduced) return;
    const svg = svgRef.current;
    if (!svg) return;

    // Collect all paths/polylines
    const strokes = svg.querySelectorAll<SVGGeometryElement>(".house-stroke");
    const fills   = svg.querySelectorAll<SVGElement>(".house-fill");

    // Hide fills initially
    fills.forEach((el) => {
      (el as SVGElement).style.opacity = "0";
      (el as SVGElement).style.transition = "opacity 1.2s ease 0s";
    });

    // Set dasharray/dashoffset for each stroke element
    strokes.forEach((el) => {
      const len = el.getTotalLength?.() ?? 600;
      el.style.strokeDasharray  = String(len);
      el.style.strokeDashoffset = String(len);
      el.style.transition = "none";
    });

    const totalDuration = 2000; // ms to draw all strokes

    const timeout = window.setTimeout(() => {
      strokes.forEach((el, i) => {
        const delay_i = (i / Math.max(strokes.length - 1, 1)) * totalDuration * 0.6;
        el.style.transition = `stroke-dashoffset ${totalDuration * 0.4}ms ease ${delay_i}ms`;
        el.style.strokeDashoffset = "0";
      });

      // Fill in after drawing is ~60% done
      window.setTimeout(() => {
        fills.forEach((el) => {
          (el as SVGElement).style.opacity = "1";
        });
      }, totalDuration * 0.65);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [reduced, delay]);

  const sw = 2.2; // stroke width

  return (
    <svg
      ref={svgRef}
      width={width}
      height={H}
      viewBox={`0 0 ${width} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="House silhouette illustration"
      role="img"
      style={style}
      className={className}
    >
      {/* -- Filled shapes (appear after stroke is done) -- */}

      {/* Main body fill */}
      <polygon
        className="house-fill"
        points={`
          ${width*0.08},${H*0.52}
          ${width*0.08},${H*0.95}
          ${width*0.92},${H*0.95}
          ${width*0.92},${H*0.52}
          ${width*0.5},${H*0.12}
        `}
        fill={fillColor}
        opacity={reduced ? 1 : 0}
        style={reduced ? {} : { transition: "opacity 1.2s ease" }}
      />

      {/* Roof fill (slightly darker) */}
      <polygon
        className="house-fill"
        points={`
          ${width*0.5},${H*0.08}
          ${width*0.04},${H*0.54}
          ${width*0.96},${H*0.54}
        `}
        fill={fillColor.replace("0.10","0.18")}
        opacity={reduced ? 1 : 0}
        style={reduced ? {} : { transition: "opacity 1.2s ease 0.2s" }}
      />

      {/* Door fill */}
      <rect
        className="house-fill"
        x={width*0.42} y={H*0.68}
        width={width*0.16} height={H*0.27}
        rx={width*0.025}
        fill={fillColor.replace("0.10","0.22")}
        opacity={reduced ? 1 : 0}
        style={reduced ? {} : { transition: "opacity 1.2s ease 0.4s" }}
      />

      {/* Window left fill */}
      <rect
        className="house-fill"
        x={width*0.16} y={H*0.60}
        width={width*0.14} height={H*0.16}
        rx={width*0.015}
        fill={fillColor.replace("0.10","0.30")}
        opacity={reduced ? 1 : 0}
        style={reduced ? {} : { transition: "opacity 1.2s ease 0.5s" }}
      />

      {/* Window right fill */}
      <rect
        className="house-fill"
        x={width*0.70} y={H*0.60}
        width={width*0.14} height={H*0.16}
        rx={width*0.015}
        fill={fillColor.replace("0.10","0.30")}
        opacity={reduced ? 1 : 0}
        style={reduced ? {} : { transition: "opacity 1.2s ease 0.6s" }}
      />

      {/* -- Stroked outlines (draw themselves) -- */}

      {/* Main house outline */}
      <polyline
        className="house-stroke"
        points={`
          ${width*0.08},${H*0.95}
          ${width*0.08},${H*0.52}
          ${width*0.5},${H*0.08}
          ${width*0.92},${H*0.52}
          ${width*0.92},${H*0.95}
          ${width*0.08},${H*0.95}
        `}
        stroke={strokeColor}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={reduced ? 1 : 1}
      />

      {/* Roof ridge */}
      <line
        className="house-stroke"
        x1={width*0.5} y1={H*0.08}
        x2={width*0.5} y2={H*0.52}
        stroke={strokeColor}
        strokeWidth={sw * 0.7}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Door */}
      <rect
        className="house-stroke"
        x={width*0.42} y={H*0.68}
        width={width*0.16} height={H*0.27}
        rx={width*0.025}
        stroke={strokeColor}
        strokeWidth={sw * 0.85}
        fill="none"
      />

      {/* Door handle */}
      <circle
        className="house-stroke"
        cx={width*0.555} cy={H*0.818}
        r={width*0.012}
        stroke={strokeColor}
        strokeWidth={sw*0.7}
        fill="none"
      />

      {/* Window left */}
      <rect
        className="house-stroke"
        x={width*0.16} y={H*0.60}
        width={width*0.14} height={H*0.16}
        rx={width*0.015}
        stroke={strokeColor}
        strokeWidth={sw*0.8}
        fill="none"
      />
      {/* Window left cross */}
      <line className="house-stroke" x1={width*0.23} y1={H*0.60} x2={width*0.23} y2={H*0.76} stroke={strokeColor} strokeWidth={sw*0.5} strokeLinecap="round" />
      <line className="house-stroke" x1={width*0.16} y1={H*0.68} x2={width*0.30} y2={H*0.68} stroke={strokeColor} strokeWidth={sw*0.5} strokeLinecap="round" />

      {/* Window right */}
      <rect
        className="house-stroke"
        x={width*0.70} y={H*0.60}
        width={width*0.14} height={H*0.16}
        rx={width*0.015}
        stroke={strokeColor}
        strokeWidth={sw*0.8}
        fill="none"
      />
      {/* Window right cross */}
      <line className="house-stroke" x1={width*0.77} y1={H*0.60} x2={width*0.77} y2={H*0.76} stroke={strokeColor} strokeWidth={sw*0.5} strokeLinecap="round" />
      <line className="house-stroke" x1={width*0.70} y1={H*0.68} x2={width*0.84} y2={H*0.68} stroke={strokeColor} strokeWidth={sw*0.5} strokeLinecap="round" />

      {/* Chimney */}
      <rect
        className="house-stroke"
        x={width*0.63} y={H*0.10}
        width={width*0.07} height={H*0.22}
        stroke={strokeColor}
        strokeWidth={sw*0.8}
        fill={fillColor}
      />

      {/* Chimney smoke puffs */}
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className="house-fill"
          cx={width*0.665}
          cy={H*(0.04 - i*0.035)}
          r={width*(0.02 + i*0.012)}
          fill={strokeColor.replace("0.85","0.08")}
          opacity={reduced ? 1 : 0}
          style={reduced ? {} : { transition: `opacity 1.2s ease ${0.8 + i*0.15}s` }}
        />
      ))}

      {/* Ground line */}
      <line
        className="house-stroke"
        x1={width*0.02} y1={H*0.97}
        x2={width*0.98} y2={H*0.97}
        stroke={strokeColor.replace("0.85","0.3")}
        strokeWidth={sw*0.6}
        strokeLinecap="round"
        strokeDasharray="4 8"
      />
    </svg>
  );
}
