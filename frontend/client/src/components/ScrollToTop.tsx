import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useReducedMotion } from "../hooks/useReducedMotion";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: reduce ? "auto" : "smooth"
    });
  }, [pathname, reduce]);

  return null;
}
