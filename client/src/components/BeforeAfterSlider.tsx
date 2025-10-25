import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
}: BeforeAfterSliderProps) {
  const { t } = useLanguage();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] overflow-hidden rounded-xl shadow-2xl cursor-ew-resize select-none border-4 border-amber-200"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={afterImage}
            alt={afterLabel || "After"}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            {afterLabel || t("slider.after")}
          </div>
        </div>

        {/* Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel || "Before"}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            {beforeLabel || t("slider.before")}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-amber-600">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <p className="text-center mt-4 text-sm text-amber-700">
        {t("slider.instruction")}
      </p>
    </div>
  );
}

