import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Droplets,
  Umbrella,
  AlertTriangle,
  Thermometer,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { mockWeather, WeatherData } from "../../mock/weather";
import { alertThresholds } from "../../config/weatherAlerts";
import { staggerContainer, fadeUp } from "../../motion/variants";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useLocationContext } from "../../context/LocationContext";

/* -----------------------------------------------------------------
   UTILITY: eased number count-up hook
----------------------------------------------------------------- */
function useCountUp(to: number, durationMs = 1400) {
  const [count, setCount] = useState(0);
  const reduce = useReducedMotion();
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reduce) { setCount(to); return; }
    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, durationMs, reduce]);

  return count;
}

/* -----------------------------------------------------------------
   COMPONENT: CountUp span
----------------------------------------------------------------- */
function CountUp({ to, duration }: { to: number; duration?: number }) {
  const count = useCountUp(to, duration);
  return <span>{count}</span>;
}

/* -----------------------------------------------------------------
   COMPONENT: Animated Weather Icon
----------------------------------------------------------------- */
function WeatherIcon({ condition, size = 72 }: { condition: string; size?: number }) {
  const reduce = useReducedMotion();

  switch (condition) {
    case "Sunny":
    case "Clear":
      return (
        <div style={{ position: "relative", width: size, height: size }}>
          <motion.div
            animate={reduce ? {} : { scale: [1, 1.18, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", inset: -10,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(251,191,36,0.45) 0%, transparent 70%)",
            }}
          />
          <motion.div
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Sun size={size} color="#FBBF24" strokeWidth={1.5} />
          </motion.div>
        </div>
      );

    case "Rainy":
      return (
        <div style={{ position: "relative", width: size, height: size + 20 }}>
          <motion.div
            animate={reduce ? {} : { x: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Cloud size={size * 0.7} color="#94A3B8" style={{ marginBottom: -8 }} />
          </motion.div>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={reduce ? {} : { y: [0, 22], opacity: [0.9, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: "easeIn" }}
              style={{
                position: "absolute",
                bottom: 0,
                left: `${18 + i * 18}%`,
                width: 2,
                height: 10,
                background: "linear-gradient(to bottom, #60A5FA, transparent)",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      );

    case "Cloudy":
    default:
      return (
        <div style={{ position: "relative" }}>
          <motion.div
            animate={reduce ? {} : { x: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", top: 10, left: 10, opacity: 0.5 }}
          >
            <Cloud size={size * 0.65} color="#CBD5E1" />
          </motion.div>
          <motion.div
            animate={reduce ? {} : { x: [4, -4, 4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Cloud size={size} color="#94A3B8" />
          </motion.div>
        </div>
      );
  }
}

/* -----------------------------------------------------------------
   COMPONENT: Animated SVG fill-ring stat tile
----------------------------------------------------------------- */
interface StatRingProps {
  pct: number;
  color: string;
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatRing({ pct, color, label, value, icon }: StatRingProps) {
  const reduce = useReducedMotion();
  const R = 28;
  const circumference = 2 * Math.PI * R;

  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduce ? {} : { y: -4, transition: { duration: 0.2 } }}
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-5)",
        textAlign: "center",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at top, ${color}18 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>
        <svg width={72} height={72} style={{ transform: "rotate(-90deg)", display: "block" }}>
          <circle cx={36} cy={36} r={R} fill="none" stroke="var(--border)" strokeWidth={5} />
          <motion.circle
            cx={36} cy={36} r={R}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: reduce ? circumference - (pct / 100) * circumference : circumference - (pct / 100) * circumference }}
            whileInView={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
          />
        </svg>
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color,
          }}
        >
          {icon}
        </div>
      </div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------
   COMPONENT: Alert Banner
----------------------------------------------------------------- */
type AlertType = "heat" | "cold" | "rain";

const ALERT_STYLES: Record<AlertType, { bg: string; border: string; color: string; label: string }> = {
  heat: { bg: "rgba(245,158,11,0.12)", border: "#F59E0B", color: "#92400E", label: "Heatwave Warning" },
  cold: { bg: "rgba(59,130,246,0.12)", border: "#3B82F6", color: "#1E3A8A", label: "Cold Wave Alert" },
  rain: { bg: "rgba(99,102,241,0.12)", border: "#6366F1", color: "#312E81", label: "Heavy Rain Warning" },
};

const ALERT_EMOJI: Record<AlertType, string> = { heat: "??", cold: "??", rain: "???" };

interface AlertBannerProps {
  type: AlertType;
  temp: number;
  rain: number;
  tip: string;
}

function AlertBanner({ type, temp, rain, tip }: AlertBannerProps) {
  const reduce = useReducedMotion();
  const s = ALERT_STYLES[type];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      layout
      style={{
        borderRadius: "var(--radius-lg)",
        border: `1.5px solid ${s.border}`,
        background: s.bg,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)",
          background: "transparent", border: "none", cursor: "pointer",
          color: s.color, textAlign: "left",
        }}
      >
        <motion.div
          animate={reduce ? {} : { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AlertTriangle size={22} color={s.border} />
        </motion.div>
        <span style={{ fontWeight: 700, fontSize: "var(--text-base)", flex: 1 }}>
          {ALERT_EMOJI[type]} {s.label} � {type === "rain" ? `${rain}mm expected` : `${temp}�C`}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0 var(--space-5) var(--space-4) calc(var(--space-5) + 28px)",
              fontSize: "var(--text-sm)", color: s.color, lineHeight: 1.6,
            }}>
              ?? <strong>Tip:</strong> {tip}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* -----------------------------------------------------------------
   COMPONENT: Custom Recharts tooltip
----------------------------------------------------------------- */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface, #fff)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)",
      padding: "var(--space-3) var(--space-4)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>{payload[0].value}�C</div>
    </div>
  );
}

/* -----------------------------------------------------------------
   COMPONENT: Daily forecast card
----------------------------------------------------------------- */
interface DayCardProps {
  day: string;
  minTemp: number;
  maxTemp: number;
  condition: string;
  index: number;
}

function DayCard({ day, minTemp, maxTemp, condition, index }: DayCardProps) {
  const reduce = useReducedMotion();
  const condColor = condition === "Sunny" || condition === "Clear"
    ? "#FBBF24" : condition === "Rainy" ? "#60A5FA" : "#94A3B8";

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      whileHover={reduce ? {} : { y: -6, boxShadow: "0 16px 40px rgba(0,0,0,0.15)", transition: { duration: 0.22 } }}
      className="card"
      style={{
        textAlign: "center",
        padding: "var(--space-5) var(--space-4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-2)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: condColor, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
      <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)" }}>{day}</div>
      <div style={{ margin: "var(--space-2) 0" }}>
        {condition === "Sunny" || condition === "Clear"
          ? <Sun size={28} color="#FBBF24" />
          : condition === "Rainy"
          ? <CloudRain size={28} color="#60A5FA" />
          : <Cloud size={28} color="#94A3B8" />}
      </div>
      <div style={{ display: "flex", gap: "var(--space-2)", fontSize: "var(--text-sm)", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, fontSize: "var(--text-base)" }}>{maxTemp}�</span>
        <span style={{ color: "var(--muted)" }}>{minTemp}�</span>
      </div>
      <div style={{ width: "100%", height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginTop: "var(--space-1)" }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.round(((maxTemp - minTemp) / 25) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 + index * 0.06 }}
          style={{ height: "100%", background: condColor, borderRadius: 2 }}
        />
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------
   MAIN COMPONENT: WeatherTab
----------------------------------------------------------------- */
export default function WeatherTab() {
  const { analysis, location } = useLocationContext();
  const reduce = useReducedMotion();

  // Merge real API data over the mock template (mock provides hourly/daily charts)
  const data: WeatherData = {
    ...mockWeather,
    location: location?.name ?? mockWeather.location,
    temperature: analysis?.weather?.temperature ?? mockWeather.temperature,
    humidity: analysis?.weather?.humidity ?? mockWeather.humidity,
    windSpeed: analysis?.weather?.wind_speed ?? mockWeather.windSpeed,
    rainVolume: analysis?.weather?.rainfall ?? mockWeather.rainVolume,
  };

  const alerts: { type: AlertType; tip: string }[] = [];
  if (data.temperature >= alertThresholds.heatwaveTemp) {
    alerts.push({ type: "heat", tip: alertThresholds.tips.heat });
  }
  if (data.temperature <= alertThresholds.coldwaveTemp) {
    alerts.push({ type: "cold", tip: alertThresholds.tips.cold });
  }
  if (data.rainVolume >= alertThresholds.heavyRainMm) {
    alerts.push({ type: "rain", tip: alertThresholds.tips.rain });
  }

  const stats = [
    { icon: <Droplets size={16} />, label: "Humidity", value: `${data.humidity}%`, pct: data.humidity, color: "#3B82F6" },
    { icon: <Wind size={16} />, label: "Wind", value: `${data.windSpeed} km/h`, pct: Math.min((data.windSpeed / 80) * 100, 100), color: "#10B981" },
    { icon: <Umbrella size={16} />, label: "Rain", value: `${data.rainVolume} mm`, pct: Math.min((data.rainVolume / 50) * 100, 100), color: "#6366F1" },
    { icon: <Sun size={16} />, label: "UV Index", value: `${data.uvIndex}/11`, pct: (data.uvIndex / 11) * 100, color: "#F59E0B" },
  ];

  const avgTemp = Math.round(data.hourly.reduce((s, h) => s + h.temp, 0) / data.hourly.length);

  return (
    <motion.div
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}
    >
      {/* ALERT BANNERS */}
      {alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {alerts.map(({ type, tip }) => (
            <AlertBanner key={type} type={type} temp={data.temperature} rain={data.rainVolume} tip={tip} />
          ))}
        </div>
      )}

      {/* CURRENT CONDITIONS + STAT TILES */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-6)", alignItems: "start" }}>
        {/* Large current-conditions card */}
        <motion.div
          variants={reduce ? undefined : fadeUp}
          className="card"
          style={{
            padding: "var(--space-8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-6)",
            background: "linear-gradient(135deg, var(--surface, #fff) 0%, rgba(251,191,36,0.06) 100%)",
            position: "relative",
            overflow: "hidden",
            minHeight: 180,
          }}
        >
          <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <Thermometer size={16} style={{ color: "var(--muted)" }} />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)", fontWeight: 500 }}>Current Temperature</span>
            </div>
            <div style={{ fontSize: "5rem", fontWeight: 800, fontFamily: "var(--font-heading)", lineHeight: 1, color: "var(--text)", letterSpacing: "-0.04em" }}>
              <CountUp to={data.temperature} duration={1400} />
              <span style={{ fontSize: "2.5rem", fontWeight: 600, color: "var(--muted)" }}>�C</span>
            </div>
            <div style={{ marginTop: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-block", padding: "2px 10px",
                borderRadius: "var(--radius-full)",
                background: data.condition === "Sunny" || data.condition === "Clear" ? "rgba(251,191,36,0.2)" : data.condition === "Rainy" ? "rgba(96,165,250,0.2)" : "rgba(148,163,184,0.2)",
                color: data.condition === "Sunny" || data.condition === "Clear" ? "#92400E" : data.condition === "Rainy" ? "#1E40AF" : "var(--muted)",
                fontSize: "var(--text-sm)", fontWeight: 600,
              }}>
                {data.condition}
              </span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <Eye size={12} />
                {data.location}
              </span>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <WeatherIcon condition={data.condition} size={80} />
          </div>
        </motion.div>

        {/* 2x2 stat rings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          {stats.map((s) => (
            <StatRing key={s.label} pct={s.pct} color={s.color} label={s.label} value={s.value} icon={s.icon} />
          ))}
        </div>
      </div>

      {/* 24-HOUR CHART */}
      <motion.div variants={reduce ? undefined : fadeUp} className="card" style={{ padding: "var(--space-6)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "var(--space-5)" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)" }}>Next 24 Hours</h3>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--muted)" }}>avg {avgTemp}�C</span>
        </div>
        <div style={{ height: 260, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.hourly} margin={{ top: 5, right: 8, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="wt-lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} dy={8} interval={3} />
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} tickFormatter={(v: number) => `${v}\u00b0`} dx={-4} />
              <ReferenceLine y={avgTemp} stroke="var(--muted)" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone" dataKey="temp"
                stroke="url(#wt-lineGrad)"
                strokeWidth={3} dot={false}
                activeDot={{ r: 7, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={reduce ? 0 : 1800}
                animationEasing="ease-out"
                animationBegin={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* 7-DAY FORECAST */}
      <motion.div
        variants={reduce ? undefined : staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
      >
        <h3 style={{ margin: 0, fontFamily: "var(--font-heading)", fontSize: "var(--text-lg)", marginLeft: "var(--space-1)" }}>7-Day Forecast</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "var(--space-3)" }}>
          {data.daily.map((day, i) => (
            <DayCard key={day.day} day={day.day} minTemp={day.minTemp} maxTemp={day.maxTemp} condition={day.condition} index={i} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

