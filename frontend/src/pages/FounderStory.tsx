import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function FounderStory() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#fafafa",
            padding: "80px 24px 120px 24px"
        }}>
            <div style={{
                maxWidth: "800px",
                margin: "0 auto",
                backgroundColor: "#fff",
                borderRadius: "32px",
                padding: "64px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
            }}>
                {/* Header */}
                <div style={{ marginBottom: "48px", textAlign: "center" }}>
                    <h1 style={{
                        fontSize: "48px",
                        fontWeight: 900,
                        color: "#0f172a",
                        marginBottom: "16px",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.1"
                    }}>
                        Building Codeown at 15
                    </h1>
                    <p style={{
                        fontSize: "20px",
                        color: "#64748b",
                        fontWeight: 500,
                        lineHeight: "1.6"
                    }}>
                        A story of passion, perseverance, and building for developers
                    </p>
                </div>

                {/* Hero Quote */}
                <div style={{
                    backgroundColor: "#f8fafc",
                    borderLeft: "4px solid #0f172a",
                    padding: "24px 32px",
                    marginBottom: "48px",
                    borderRadius: "12px"
                }}>
                    <p style={{
                        fontSize: "20px",
                        fontStyle: "italic",
                        color: "#1e293b",
                        margin: 0,
                        lineHeight: "1.7",
                        fontWeight: 500
                    }}>
                        "Age is just a number when you have a vision. At 15, I decided to build the platform I wished existed—a place where developers could truly connect, showcase their work, and grow together."
                    </p>
                </div>

                {/* Story Content */}
                <div style={{
                    fontSize: "17px",
                    lineHeight: "1.8",
                    color: "#334155"
                }}>
                    {/* The Beginning */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{
                            fontSize: "32px",
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: "20px",
                            letterSpacing: "-0.02em"
                        }}>
                            The Beginning
                        </h2>
                        <p style={{ marginBottom: "20px" }}>
                            I was 15 years old when I started building Codeown. Like many developers, I had been coding for years, sharing my projects on various platforms, but something always felt missing. I wanted a space that wasn't just about code—it was about the people behind it, their stories, their growth, and their journey.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            The idea for Codeown came to me during a late-night coding session. I realized that developers needed more than just a portfolio site or a social network. They needed a <strong>Developer Operating System</strong>—a platform that would become the central hub for their entire developer life.
                        </p>
                    </section>

                    {/* The Obstacles */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{
                            fontSize: "32px",
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: "20px",
                            letterSpacing: "-0.02em"
                        }}>
                            The Obstacles
                        </h2>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "22px",
                                fontWeight: 700,
                                color: "#1e293b",
                                marginBottom: "12px"
                            }}>
                                Being Taken Seriously
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                The hardest obstacle was being 15. When you're young, people doubt you. They see your age before they see your vision. I had to prove myself with every line of code, every feature I shipped, every user who joined the platform. I learned that actions speak louder than age.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "22px",
                                fontWeight: 700,
                                color: "#1e293b",
                                marginBottom: "12px"
                            }}>
                                Learning Advanced Technologies
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Building Codeown required technologies I had never used before—React, Node.js, PostgreSQL, real-time features, authentication systems. I spent countless nights reading documentation, watching tutorials, debugging errors that seemed impossible to solve. Every bug was a lesson. Every error message was a teacher.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "22px",
                                fontWeight: 700,
                                color: "#1e293b",
                                marginBottom: "12px"
                            }}>
                                Balancing School and Building
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Being in school while building a startup was brutal. I coded before school, during lunch breaks, and late into the night. I sacrificed sleep, social events, and free time. My parents worried. My teachers questioned. But I knew what I was building mattered.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "22px",
                                fontWeight: 700,
                                color: "#1e293b",
                                marginBottom: "12px"
                            }}>
                                Technical Challenges
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Building a real-time messaging system, handling users, optimizing database queries, implementing authentication securely, making everything responsive—these weren't easy problems. I learned by doing, by failing, by iterating. I rewrote the codebase three times before getting it right.
                            </p>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <h3 style={{
                                fontSize: "22px",
                                fontWeight: 700,
                                color: "#1e293b",
                                marginBottom: "12px"
                            }}>
                                Finding the First Users
                            </h3>
                            <p style={{ marginBottom: "20px" }}>
                                Getting people to join was terrifying. What if they didn't like it? What if it broke? What if no one cared? I shared Codeown everywhere—on Reddit, Twitter, Discord servers. The first user felt like a miracle, Every new user motivated me to build better features.
                            </p>
                        </div>
                    </section>

                    {/* What I Learned */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{
                            fontSize: "32px",
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: "20px",
                            letterSpacing: "-0.02em"
                        }}>
                            What I Learned
                        </h2>
                        <ul style={{
                            listStyle: "none",
                            padding: 0,
                            margin: 0
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
                                    marginBottom: "16px",
                                    paddingLeft: "32px",
                                    position: "relative",
                                    fontSize: "17px",
                                    lineHeight: "1.7"
                                }}>
                                    <span style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "2px",
                                        fontSize: "24px",
                                        color: "#0f172a"
                                    }}>•</span>
                                    {lesson}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* The Vision */}
                    <section style={{ marginBottom: "48px" }}>
                        <h2 style={{
                            fontSize: "32px",
                            fontWeight: 800,
                            color: "#0f172a",
                            marginBottom: "20px",
                            letterSpacing: "-0.02em"
                        }}>
                            The Vision Forward
                        </h2>
                        <p style={{ marginBottom: "20px" }}>
                            Codeown is more than a platform—it's a movement. A place where developers of all ages, backgrounds, and skill levels can showcase their work, connect with others, and grow together. Where your code speaks louder than your credentials. Where your projects matter more than your job title.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            We're building features that will change how developers collaborate, learn, and build careers. From AI-powered code reviews to collaborative coding spaces, from project showcases to hiring tools—we're creating the ultimate Developer Operating System.
                        </p>
                        <p style={{ marginBottom: "20px" }}>
                            I'm still learning. Still building. Still 15 (well, getting older every day). But now, I'm not building alone. I'm building with thousands of developers who believe in the vision.
                        </p>
                    </section>

                    {/* Closing */}
                    <div style={{
                        backgroundColor: "#0f172a",
                        color: "#fff",
                        padding: "40px",
                        borderRadius: "20px",
                        textAlign: "center",
                        marginTop: "48px"
                    }}>
                        <p style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            marginBottom: "16px",
                            lineHeight: "1.6"
                        }}>
                            To every young builder reading this:
                        </p>
                        <p style={{
                            fontSize: "18px",
                            lineHeight: "1.7",
                            margin: 0,
                            opacity: 0.95
                        }}>
                            Don't wait until you're "ready." Don't wait until you're "old enough."
                            Start building today. Your age is your superpower—you have time, energy,
                            and fresh perspectives. The world needs what you're going to create.
                        </p>
                    </div>

                    {/* CTA */}
                    <div style={{
                        textAlign: "center",
                        marginTop: "56px",
                        paddingTop: "48px",
                        borderTop: "2px solid #f1f5f9"
                    }}>
                        <p style={{
                            fontSize: "20px",
                            color: "#64748b",
                            marginBottom: "24px",
                            fontWeight: 500
                        }}>
                            Want to be part of the journey?
                        </p>
                        <Link
                            to="/"
                            style={{
                                display: "inline-block",
                                padding: "16px 32px",
                                backgroundColor: "#0f172a",
                                color: "#fff",
                                borderRadius: "100px",
                                fontSize: "17px",
                                fontWeight: 700,
                                textDecoration: "none",
                                transition: "transform 0.2s, box-shadow 0.2s",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.1)"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
                            }}
                        >
                            Join Codeown Today →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
