import { useState } from "react";
import { getOptimizedImageUrl, handleImageError } from "../utils/image";

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
      marginTop: "16px",
      borderRadius: "12px",
      overflow: "hidden",
      backgroundColor: "#f5f7fa",
    }}>
      {/* Main Image */}
      <div 
        style={{ position: "relative", width: "100%", paddingTop: "56.25%", cursor: onImageClick ? "pointer" : "default" }}
        onClick={(e) => {
          if (onImageClick) {
            e.stopPropagation();
            onImageClick(currentIndex);
          }
        }}
      > {/* 16:9 aspect ratio */}
        <img
          src={getOptimizedImageUrl(images[currentIndex])}
          alt={`Slide ${currentIndex + 1}`}
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

        {/* Navigation Arrows - Only show if more than one image */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => goToPrevious(e)}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: "none",
                color: "#ffffff",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                transition: "all 0.2s",
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
              }}
            >
              ‹
            </button>
            <button
              onClick={(e) => goToNext(e)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: "none",
                color: "#ffffff",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                transition: "all 0.2s",
                zIndex: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
              }}
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          padding: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.05)",
        }}>
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(e, index)}
              style={{
                width: index === currentIndex ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: index === currentIndex ? "#000" : "#000",
                cursor: "pointer",
                transition: "all 0.2s",
                padding: 0,
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}



