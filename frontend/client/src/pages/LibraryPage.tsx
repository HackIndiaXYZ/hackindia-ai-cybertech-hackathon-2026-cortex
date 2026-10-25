import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageVariants } from "../motion/variants";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { X } from "lucide-react";

interface LibraryItem {
  id: string;
  name: string;
  zone: string;
  image: string;
  description: string;
}

const mockLibrary: LibraryItem[] = [
  { id: "1", name: "Earthship Biotecture", zone: "HOT_DRY", image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400&q=80", description: "Radically sustainable passive solar earth shelter made of both natural and upcycled materials." },
  { id: "2", name: "Malay Kampung House", zone: "WARM_HUMID", image: "https://images.unsplash.com/photo-1596700816999-52e41c4a04d8?auto=format&fit=crop&w=400&q=80", description: "Raised on stilts with slatted floors and walls to maximize cross-ventilation in hot, humid climates." },
  { id: "3", name: "Courtyard Haveli", zone: "HOT_DRY", image: "https://images.unsplash.com/photo-1565597799538-40333da56294?auto=format&fit=crop&w=400&q=80", description: "Traditional townhouse with an open central courtyard acting as a cooling chimney." },
  { id: "4", name: "Alpine Chalet", zone: "COLD", image: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=400&q=80", description: "Steep pitched roof to shed snow and thick timber walls for thermal insulation." },
  { id: "5", name: "Bamboo Longhouse", zone: "WARM_HUMID", image: "https://images.unsplash.com/photo-1542456426-388de968f921?auto=format&fit=crop&w=400&q=80", description: "Breathable bamboo structure that offers shading and rapid heat dissipation." },
  { id: "6", name: "New England Saltbox", zone: "TEMPERATE", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=80", description: "Asymmetrical roof deflecting cold winter winds, while windows capture southern sun." }
];

const ZONES = ["All", "HOT_DRY", "WARM_HUMID", "COMPOSITE", "TEMPERATE", "COLD"];

export default function LibraryPage() {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredItems = filter === "All" ? mockLibrary : mockLibrary.filter(item => item.zone === filter);
  const selectedItem = mockLibrary.find(i => i.id === selectedId);

  return (
    <motion.main
      variants={reduce ? undefined : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 1200, margin: "0 auto", paddingBottom: "100px", minHeight: "100vh" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-8)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontSize: "var(--text-3xl)", margin: "0 0 var(--space-2)" }}>Vernacular Library</h1>
          <p style={{ color: "var(--muted)", margin: 0, maxWidth: 600 }}>Explore time-tested architectural patterns from around the world that respond passively to their local climate.</p>
        </div>
        
        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setFilter(z)}
              style={{
                background: filter === z ? "var(--primary)" : "var(--bg)",
                color: filter === z ? "#fff" : "var(--text)",
                border: filter === z ? "none" : "1px solid var(--border)",
                padding: "var(--space-2) var(--space-4)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {z === "All" ? z : z.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        layout={!reduce}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-6)" }}
      >
        <AnimatePresence>
          {filteredItems.map(item => (
            <motion.div
              layoutId={!reduce ? `card-${item.id}` : undefined}
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={reduce ? undefined : { y: -5, rotateX: 2, rotateY: -2, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
              onClick={() => setSelectedId(item.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedId(item.id); }}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${item.name}`}
              className="card"
              style={{
                cursor: "pointer", overflow: "hidden", display: "flex", flexDirection: "column",
                perspective: 1000, transformStyle: "preserve-3d"
              }}
            >
              <motion.img 
                layoutId={!reduce ? `image-${item.id}` : undefined}
                src={item.image} 
                alt={item.name} 
                style={{ width: "100%", height: 200, objectFit: "cover" }} 
              />
              <div style={{ padding: "var(--space-5)" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--primary)", fontWeight: 700, marginBottom: "var(--space-1)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.zone.replace("_", " ")}
                </div>
                <motion.h3 layoutId={!reduce ? `title-${item.id}` : undefined} style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)" }}>{item.name}</motion.h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "var(--text-sm)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {selectedId && selectedItem && (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              aria-hidden="true"
            />
            <motion.div
              layoutId={!reduce ? `card-${selectedItem.id}` : undefined}
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="card"
              style={{ position: "relative", zIndex: 1001, width: "100%", maxWidth: 600, overflow: "hidden" }}
            >
              <button 
                onClick={() => setSelectedId(null)}
                aria-label="Close modal"
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", padding: 8, borderRadius: "50%", cursor: "pointer", zIndex: 10 }}
              >
                <X size={20} />
              </button>
              <motion.img 
                layoutId={!reduce ? `image-${selectedItem.id}` : undefined}
                src={selectedItem.image} 
                alt={selectedItem.name} 
                style={{ width: "100%", height: 300, objectFit: "cover" }} 
              />
              <div style={{ padding: "var(--space-8)" }}>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--primary)", fontWeight: 700, marginBottom: "var(--space-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {selectedItem.zone.replace("_", " ")}
                </div>
                <motion.h2 id="modal-title" layoutId={!reduce ? `title-${selectedItem.id}` : undefined} style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-2xl)" }}>
                  {selectedItem.name}
                </motion.h2>
                <p style={{ margin: 0, color: "var(--text)", fontSize: "var(--text-md)", lineHeight: 1.6 }}>
                  {selectedItem.description}
                </p>
                <p style={{ marginTop: "var(--space-4)", color: "var(--muted)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
                  By examining vernacular architecture, we can identify passive design strategies that have evolved over centuries to provide comfort without reliance on mechanical systems. This specific typology utilizes thermal mass, specific orientation, and structural design tailored to its extreme environment.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
