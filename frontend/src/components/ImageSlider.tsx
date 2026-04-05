import { useState } from "react";
import { getOptimizedImageUrl, handleImageError } from "../utils/image";
import { CaretLeft, CaretRight } from "phosphor-react";

interface ImageSliderProps {
  images: string[];
  onImageClick?: (index: number) => void;
}

export default function ImageSlider({ images, onImageClick }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      borderRadius: "var(--radius-md)",
      overflow: "hidden",
      backgroundColor: "transparent",
    }}>
      <style>{`
        .image-slide-enter {
          animation: slideFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes slideFadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        .nav-btn:hover {
          transform: translateY(-50%) scale(1.15);
          background-color: rgba(0, 0, 0, 0.8) !important;
        }
        .nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
      `}</style>

      {/* Main Image Container */}
      <div 
        style={{ 
          position: "relative", 
          width: "100%", 
          paddingTop: "56.25%", 
          cursor: onImageClick ? "pointer" : "default",
          overflow: "hidden",
          borderRadius: "var(--radius-md)",
        }}
        onClick={(e) => {
          if (onImageClick) {
            e.stopPropagation();
            onImageClick(currentIndex);
          }
        }}
      >
        <img
          key={currentIndex}
          src={getOptimizedImageUrl(images[currentIndex])}
          alt={`Slide ${currentIndex + 1}`}
          className="image-slide-enter"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          onError={(e) => handleImageError(e.currentTarget)}
          loading="lazy"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="nav-btn"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                border: "none",
                color: "#ffffff",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 10,
              }}
              aria-label="Previous image"
            >
              <CaretLeft size={28} weight="bold" />
            </button>
            <button
              onClick={goToNext}
              className="nav-btn"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(4px)",
                border: "none",
                color: "#ffffff",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 10,
              }}
              aria-label="Next image"
            >
              <CaretRight size={28} weight="bold" />
            </button>
          </>
        )}

        {/* Floating Indicator Dots Overlay */}
        {images.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            padding: "8px 12px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(8px)",
            borderRadius: "100px",
            zIndex: 11,
          }}>
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(e, index)}
                style={{
                  width: index === currentIndex ? "16px" : "6px",
                  height: "6px",
                  borderRadius: "100px",
                  border: "none",
                  backgroundColor: index === currentIndex ? "#fff" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  padding: 0,
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



