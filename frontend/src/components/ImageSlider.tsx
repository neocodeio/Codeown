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
    <div className="image-slider-container">
      <style>{`
        .image-slider-container {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          overflow: hidden;
          background-color: transparent;
        }
        .image-slide-enter {
          animation: slideFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes slideFadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        .nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: none;
          color: #ffffff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          padding: 0;
        }
        .nav-btn:hover {
          background-color: rgba(0, 0, 0, 0.7);
          transform: translateY(-50%) scale(1.1);
        }
        .nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .indicator-pill {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background-color: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 100px;
          z-index: 11;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .dot {
          height: 6px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          flex-shrink: 0;
          background-color: rgba(255, 255, 255, 0.4);
        }
        .dot.active {
          background-color: #fff;
          width: 12px;
        }
        .dot:not(.active) {
          width: 6px;
        }
        
        @media (max-width: 640px) {
          .nav-btn {
            width: 36px;
            height: 36px;
          }
          .nav-btn svg {
            width: 20px;
            height: 20px;
          }
          .indicator-pill {
            bottom: 8px;
            padding: 4px 8px;
            gap: 4px;
          }
          .dot {
            height: 4px;
          }
          .dot.active {
            width: 10px;
          }
          .dot:not(.active) {
            width: 4px;
          }
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
              style={{ left: "10px" }}
              aria-label="Previous image"
            >
              <CaretLeft weight="bold" />
            </button>
            <button
              onClick={goToNext}
              className="nav-btn"
              style={{ right: "10px" }}
              aria-label="Next image"
            >
              <CaretRight weight="bold" />
            </button>
          </>
        )}

        {/* Floating Indicator Dots Overlay */}
        {images.length > 1 && (
          <div className="indicator-pill">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => goToSlide(e, index)}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
