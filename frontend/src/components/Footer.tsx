import { useTheme } from "../context/ThemeContext";

export default function Footer() {
    const { theme } = useTheme();
    
    return (
        <footer style={{
            marginTop: "0px",
            padding: "40px 20px",
            backgroundColor: "var(--bg-hover)",
            borderTop: "0.5px solid var(--border-hairline)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px"
        }}>
            {/* Product Hunt Badge */}
            <div style={{
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center"
            }}>
                <a
                    href="https://www.producthunt.com/products/codeown?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-codeown"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        alt="Codeown - A social platform for developers to share projects and ideas | Product Hunt"
                        width="250"
                        height="54"
                        src={`https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1072186&theme=${theme === 'dark' ? 'dark' : 'light'}&t=1770201427808`}
                    />
                </a>
            </div>

            {/* FoundrList */}
            <a href="https://foundrlist.com/product/codeown" target="_blank" rel="noopener noreferrer">
                <img
                    src="https://foundrlist.com/api/badge/codeown"
                    alt="Live on FoundrList"
                    width="180"
                    height="72"
                />
            </a>

            {/* Footer Text */}
            <div style={{
                textAlign: "center",
                color: "var(--text-tertiary)",
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
            }}>
                <p style={{ margin: "0 0 8px 0", fontWeight: 700 }}>
                    © {new Date().getFullYear()} Codeown.
                </p>
                <div style={{
                    display: "flex",
                    gap: "16px",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    fontSize: "11px",
                    fontWeight: 700
                }}>
                    <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>PRIVACY</a>
                    <span style={{ color: "var(--border-hairline)" }}>•</span>
                    <a href="/terms" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>TERMS</a>
                    <span style={{ color: "var(--border-hairline)" }}>•</span>
                    <a href="/about" style={{ color: "inherit", textDecoration: "none" }} onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={e => e.currentTarget.style.color = "inherit"}>ABOUT</a>
                </div>
            </div>
        </footer>
    );
}
