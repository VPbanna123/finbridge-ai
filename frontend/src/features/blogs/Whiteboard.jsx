import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const COLORS = ["#172033", "#2563eb", "#059669", "#dc2626", "#7c3aed", "#f59e0b"];
const SIZES = [2, 4, 8, 14];

/**
 * Simple built-in whiteboard (admin only). Draw with the pointer, then
 * "Use drawing" exports a PNG data URI that is uploaded to Cloudinary.
 */
export default function Whiteboard({ onClose, onSave }) {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [mode, setMode] = useState("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPoint(e);
  };

  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPoint(e);
    ctx.strokeStyle = mode === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = mode === "eraser" ? size * 4 : size;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    last.current = point;
  };

  const stop = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const save = () => {
    const dataUri = canvasRef.current.toDataURL("image/png");
    onSave(dataUri);
  };

  return (
    <div className="whiteboard-overlay" role="dialog" aria-modal="true">
      <div className="whiteboard-modal">
        <div className="whiteboard-head">
          <h3>{t("whiteboard.title")}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t("whiteboard.close")}>
            ✕
          </button>
        </div>

        <div className="whiteboard-toolbar">
          <div className="wb-group">
            <button
              type="button"
              className={`wb-tool ${mode === "pen" ? "active" : ""}`}
              onClick={() => setMode("pen")}
            >
              {t("whiteboard.pen")}
            </button>
            <button
              type="button"
              className={`wb-tool ${mode === "eraser" ? "active" : ""}`}
              onClick={() => setMode("eraser")}
            >
              {t("whiteboard.eraser")}
            </button>
          </div>

          <div className="wb-group">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={`wb-swatch ${color === c && mode === "pen" ? "active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  setMode("pen");
                }}
                aria-label={t("whiteboard.color", { color: c })}
              />
            ))}
          </div>

          <div className="wb-group">
            {SIZES.map((s) => (
              <button
                type="button"
                key={s}
                className={`wb-size ${size === s ? "active" : ""}`}
                onClick={() => setSize(s)}
                aria-label={t("whiteboard.brushSize", { size: s })}
              >
                <span style={{ width: s + 2, height: s + 2 }} />
              </button>
            ))}
          </div>

          <button type="button" className="btn secondary wb-clear" onClick={clear}>
            {t("whiteboard.clear")}
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={1000}
          height={620}
          className="whiteboard-canvas"
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={stop}
          onPointerLeave={stop}
        />

        <div className="whiteboard-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            {t("whiteboard.cancel")}
          </button>
          <button type="button" className="btn primary" onClick={save}>
            {t("whiteboard.useDrawing")}
          </button>
        </div>
      </div>
    </div>
  );
}
