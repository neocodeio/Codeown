import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { CaretLeft, TwitterLogo } from "phosphor-react";

export default function FounderStory() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "var(--bg-page)",
            padding: "48px 24px 96px 24px"
        }}>
            <div style={{
                maxWidth: "640px",
                margin: "0 auto"
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "none",
                        border: "none",
                        color: "var(--text-tertiary)",
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        fontSize: "11px",
                        cursor: "pointer",
                        marginBottom: "48px",
                        padding: 0,
                        transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-tertiary)"}
                >
                    <CaretLeft size={16} weight="bold" />
                    BACK
                </button>
                <header style={{ marginBottom: "56px" }}>
                    <h1 style={{
                        fontSize: "24px",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "16px",
                        lineHeight: "1.2",
                        textTransform: "uppercase",
                        letterSpacing: "-0.02em"
                    }}>
                        Building Codeown at 15
                    </h1>
                    <p style={{
                        fontSize: "15px",
                        color: "var(--text-secondary)",
                        lineHeight: "1.6",
                        margin: 0,
                        maxWidth: "500px"
                    }}>
                        A story of passion, perseverance, and building for developers.
                    </p>
                </header>

                {/* Main Content */}
                <article style={{
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "var(--text-primary)"
                }}>
                    {/* The Beginning */}
                    <section style={{ marginBottom: "56px" }}>
                        <h2 style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "24px",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}>
                            THE BEGINNING
                        </h2>
                        <p style={{ marginBottom: "20px" }}>
                            I was 15 years old when I started building Codeown. Like many developers, I had been coding for years, sharing my projects on various platforms, but something always felt missing. I wanted a space that wasn't just about code—it was about the people behind it, their stories, their growth, and their journey.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            The idea for Codeown came to me during a late-night coding session. I realized that developers needed more than just a portfolio site or a social network. They needed a Developer Operating System—a platform that would become the central hub for their entire developer life.
                        </p>
                    </section>

                    {/* The Obstacles */}
                    <section style={{ marginBottom: "56px" }}>
                        <h2 style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "32px",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}>
                            THE OBSTACLES
                        </h2>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "12px",
                                textTransform: "uppercase"
                            }}>
                                Being Taken Seriously
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                The hardest obstacle was being 15. When you're young, people doubt you. They see your age before they see your vision. I had to prove myself with every line of code, every feature I shipped, every user who joined the platform. I learned that actions speak louder than age.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "12px",
                                textTransform: "uppercase"
                            }}>
                                Learning Advanced Technologies
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Building Codeown required technologies I had never used before—React, Node.js, PostgreSQL, real-time features, authentication systems. I spent countless nights reading documentation, watching tutorials, debugging errors that seemed impossible to solve. Every bug was a lesson. Every error message was a teacher.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "12px",
                                textTransform: "uppercase"
                            }}>
                                Balancing School and Building
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Being in school while building a startup was brutal. I coded before school, during lunch breaks, and late into the night. I sacrificed sleep, social events, and free time. My parents worried. My teachers questioned. But I knew what I was building mattered.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "12px",
                                textTransform: "uppercase"
                            }}>
                                Technical Challenges
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Building a real-time messaging system, handling users, optimizing database queries, implementing authentication securely, making everything responsive—these weren't easy problems. I learned by doing, by failing, by iterating. I rewrote the codebase three times before getting it right.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "12px",
                                textTransform: "uppercase"
                            }}>
                                Finding the First Users
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Getting people to join was terrifying. What if they didn't like it? What if it broke? What if no one cared? I shared Codeown everywhere—on Reddit, Twitter, Discord servers. The first user felt like a miracle. Every new user motivated me to build better features.
                            </p>
                        </div>
                    </section>

                    {/* What I Learned */}
                    <section style={{ marginBottom: "56px" }}>
                        <h2 style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "32px",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}>
                            WHAT I LEARNED
                        </h2>
                        <ul style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px"
                        }}>
                            {[
                                "Ship fast, iterate faster. Perfection is the enemy of progress.",
                                "Listen to your users. They'll tell you what to build next.",
                                "Code is just the beginning. Community is what makes a platform alive.",
                                "Age doesn't matter. Execution does.",
                                "Failure is feedback. Every bug taught me something new.",
                                "Building in public creates accountability and attracts believers.",
                                "Your limitations are opportunities to learn and grow."
                            ].map((lesson, idx) => (
                                <li key={idx} style={{
                                    fontSize: "14px",
                                    lineHeight: "1.6",
                                    color: "var(--text-secondary)",
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "flex-start"
                                }}>
                                    <span style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{idx + 1}.</span>
                                    {lesson}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* The Vision */}
                    <section style={{ marginBottom: "56px" }}>
                        <h2 style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "32px",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em"
                        }}>
                            THE VISION FORWARD
                        </h2>
                        <p style={{ marginBottom: "20px" }}>
                            Codeown is more than a platform—it's a movement. A place where developers of all ages, backgrounds, and skill levels can showcase their work, connect with others, and grow together. Where your code speaks louder than your credentials. Where your projects matter more than your job title.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            We're building features that will change how developers collaborate, learn, and build careers. From AI-powered code reviews to collaborative coding spaces, from project showcases to hiring tools—we're creating the ultimate Developer Operating System.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            I'm still learning. Still building. Still growing. But now, I'm not building alone. I'm building with thousands of developers who believe in the vision.
                        </p>
                    </section>

                    {/* Closing Message */}
                    <div style={{
                        backgroundColor: "var(--bg-hover)",
                        padding: "32px",
                        borderRadius: "2px",
                        border: "0.5px solid var(--border-hairline)",
                        marginTop: "56px",
                        marginBottom: "48px"
                    }}>
                        <p style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            marginBottom: "16px",
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
                        }}>
                            TO EVERY YOUNG BUILDER:
                        </p>
                        <p style={{
                            fontSize: "15px",
                            lineHeight: "1.7",
                            margin: 0,
                            color: "var(--text-secondary)"
                        }}>
                            Don't wait until you're "ready." Don't wait until you're "old enough." Start building today. Your age is your superpower—you have time, energy, and fresh perspectives. The world needs what you're going to create.
                        </p>
                    </div>

                    {/* CTA */}
                    <div style={{
                        textAlign: "center",
                        paddingTop: "48px",
                        borderTop: "0.5px solid var(--border-hairline)"
                    }}>
                        <p style={{
                            fontSize: "12px",
                            color: "var(--text-tertiary)",
                            marginBottom: "24px",
                            fontFamily: "var(--font-mono)",
                            textTransform: "uppercase"
                        }}>
                            Want to be part of the journey?
                        </p>
                        <Link
                            to="/"
                            style={{
                                display: "inline-block",
                                padding: "12px 32px",
                                backgroundColor: "var(--text-primary)",
                                color: "var(--bg-page)",
                                borderRadius: "2px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                                fontFamily: "var(--font-mono)",
                                textTransform: "uppercase",
                                transition: "all 0.15s ease",
                                letterSpacing: "0.05em"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = "0.9";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = "1";
                            }}
                        >
                            Join Codeown Today
                        </Link>
                        <div style={{ marginTop: "32px", display: "flex", justifyContent: "center" }}>
                            <a
                                href="https://x.com/amincodes"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "var(--text-tertiary)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                    fontFamily: "var(--font-mono)",
                                    textTransform: "uppercase",
                                    transition: "all 0.15s ease",
                                    letterSpacing: "0.05em",
                                    padding: "4px 8px",
                                    border: "0.5px solid var(--border-hairline)",
                                    borderRadius: "2px"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "var(--text-primary)";
                                    e.currentTarget.style.borderColor = "var(--text-primary)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "var(--text-tertiary)";
                                    e.currentTarget.style.borderColor = "var(--border-hairline)";
                                }}
                            >
                                <TwitterLogo size={14} weight="fill" />
                                @amincodes
                            </a>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
}
