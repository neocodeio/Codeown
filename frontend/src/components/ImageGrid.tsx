import { getOptimizedImageUrl, handleImageError } from "../utils/image";
import { useWindowSize } from "../hooks/useWindowSize";

interface ImageGridProps {
    images: string[];
    onImageClick?: (index: number) => void;
}

export default function ImageGrid({ images, onImageClick }: ImageGridProps) {
    const { width } = useWindowSize();
    const isMobile = width < 768;

    if (!images || images.length === 0) return null;

    const count = images.length;

    // Determine the overall aspect ratio of the grid container
    const getGridAspectRatio = () => {
        if (count === 1) return "auto";
        if (isMobile) return "1/1";
        return "16/9";
    };

    const renderImage = (src: string, index: number, style: React.CSSProperties = {}) => (
        <div
            key={index}
            onClick={(e) => {
                e.stopPropagation();
                onImageClick?.(index);
            }}
            style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                backgroundColor: "var(--bg-hover)",
                ...style
            }}
        >
            <img
                src={getOptimizedImageUrl(src)}
                alt=""
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)",
                }}
                onError={(e) => handleImageError(e.currentTarget)}
                onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            />
        </div>
    );

    return (
        <div style={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "0.5px solid var(--border-hairline)",
            width: "100%",
            display: "grid",
            gridTemplateColumns: count === 1 ? "1fr" : "1fr 1fr",
            gridTemplateRows: count <= 2 ? "1fr" : "1fr 1fr",
            gap: "2px",
            aspectRatio: getGridAspectRatio(),
            maxHeight: count === 1 ? "600px" : isMobile ? "400px" : "512px",
            backgroundColor: "var(--border-hairline)"
        }}>
            {count === 1 && renderImage(images[0], 0, {
                maxHeight: "600px",
                width: "100%",
                aspectRatio: "auto"
            })}

            {count === 2 && (
                <>
                    {renderImage(images[0], 0, { height: "100%" })}
                    {renderImage(images[1], 1, { height: "100%" })}
                </>
            )}

            {count === 3 && (
                <>
                    {renderImage(images[0], 0, { gridRow: "span 2", height: "100%" })}
                    <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "2px", height: "100%" }}>
                        {renderImage(images[1], 1, { height: "100%" })}
                        {renderImage(images[2], 2, { height: "100%" })}
                    </div>
                </>
            )}

            {count >= 4 && (
                <>
                    {renderImage(images[0], 0, { height: "100%" })}
                    {renderImage(images[1], 1, { height: "100%" })}
                    {renderImage(images[2], 2, { height: "100%" })}
                    <div style={{ position: "relative", height: "100%" }}>
                        {renderImage(images[3], 3, { height: "100%" })}
                        {count > 4 && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    backdropFilter: "blur(4px)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#fff",
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    pointerEvents: "none"
                                }}
                            >
                                +{count - 4}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
