import { Link } from "react-router-dom";
import { useEffect } from "react";

export default function FounderStory() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#ffffff",
            padding: "40px 20px 80px 20px"
        }}>
            <div style={{
                maxWidth: "680px",
                margin: "0 auto"
            }}>
                {/* Header */}
                <header style={{ marginBottom: "40px" }}>
                    <h1 style={{
                        fontSize: "clamp(28px, 5vw, 40px)",
                        fontWeight: 700,
                        color: "#1a1a1a",
                        marginBottom: "12px",
                        lineHeight: "1.2"
                    }}>
                        Building Codeown at 15
                    </h1>
                    <p style={{
                        fontSize: "16px",
                        color: "#666",
                        lineHeight: "1.6",
                        margin: 0
                    }}>
                        A story of passion, perseverance, and building for developers
                    </p>
                </header>

                {/* Main Content */}
                <article style={{
                    fontSize: "16px",
                    lineHeight: "1.7",
                    color: "#333"
                }}>
                    {/* The Beginning */}
                    <section style={{ marginBottom: "40px" }}>
                        <h2 style={{
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "16px"
                        }}>
                            The Beginning
                        </h2>
                        <p style={{ marginBottom: "16px" }}>
                            I was 15 years old when I started building Codeown. Like many developers, I had been coding for years, sharing my projects on various platforms, but something always felt missing. I wanted a space that wasn't just about code—it was about the people behind it, their stories, their growth, and their journey.
                        </p>
                        <p style={{ marginBottom: "16px" }}>
                            The idea for Codeown came to me during a late-night coding session. I realized that developers needed more than just a portfolio site or a social network. They needed a Developer Operating System—a platform that would become the central hub for their entire developer life.
                        </p>
                    </section>

                    {/* The Obstacles */}
                    <section style={{ marginBottom: "40px" }}>
                        <h2 style={{
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "16px"
                        }}>
                            The Obstacles
                        </h2>

                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                                marginBottom: "8px"
                            }}>
                                Being Taken Seriously
                            </h3>
                            <p style={{ marginBottom: "16px" }}>
                                The hardest obstacle was being 15. When you're young, people doubt you. They see your age before they see your vision. I had to prove myself with every line of code, every feature I shipped, every user who joined the platform. I learned that actions speak louder than age.
                            </p>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                                marginBottom: "8px"
                            }}>
                                Learning Advanced Technologies
                            </h3>
                            <p style={{ marginBottom: "16px" }}>
                                Building Codeown required technologies I had never used before—React, Node.js, PostgreSQL, real-time features, authentication systems. I spent countless nights reading documentation, watching tutorials, debugging errors that seemed impossible to solve. Every bug was a lesson. Every error message was a teacher.
                            </p>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                                marginBottom: "8px"
                            }}>
                                Balancing School and Building
                            </h3>
                            <p style={{ marginBottom: "16px" }}>
                                Being in school while building a startup was brutal. I coded before school, during lunch breaks, and late into the night. I sacrificed sleep, social events, and free time. My parents worried. My teachers questioned. But I knew what I was building mattered.
                            </p>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                                marginBottom: "8px"
                            }}>
                                Technical Challenges
                            </h3>
                            <p style={{ marginBottom: "16px" }}>
                                Building a real-time messaging system, handling users, optimizing database queries, implementing authentication securely, making everything responsive—these weren't easy problems. I learned by doing, by failing, by iterating. I rewrote the codebase three times before getting it right.
                            </p>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <h3 style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                color: "#1a1a1a",
                                marginBottom: "8px"
                            }}>
                                Finding the First Users
                            </h3>
                            <p style={{ marginBottom: "16px" }}>
                                Getting people to join was terrifying. What if they didn't like it? What if it broke? What if no one cared? I shared Codeown everywhere—on Reddit, Twitter, Discord servers. The first user felt like a miracle. Every new user motivated me to build better features.
                            </p>
                        </div>
                    </section>

                    {/* What I Learned */}
                    <section style={{ marginBottom: "40px" }}>
                        <h2 style={{
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "16px"
                        }}>
                            What I Learned
                        </h2>
                        <ul style={{
                            listStyle: "disc",
                            paddingLeft: "24px",
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
                                    marginBottom: "12px",
                                    lineHeight: "1.7"
                                }}>
                                    {lesson}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* The Vision */}
                    <section style={{ marginBottom: "40px" }}>
                        <h2 style={{
                            fontSize: "24px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                            marginBottom: "16px"
                        }}>
                            The Vision Forward
                        </h2>
                        <p style={{ marginBottom: "16px" }}>
                            Codeown is more than a platform—it's a movement. A place where developers of all ages, backgrounds, and skill levels can showcase their work, connect with others, and grow together. Where your code speaks louder than your credentials. Where your projects matter more than your job title.
                        </p>
                        <p style={{ marginBottom: "16px" }}>
                            We're building features that will change how developers collaborate, learn, and build careers. From AI-powered code reviews to collaborative coding spaces, from project showcases to hiring tools—we're creating the ultimate Developer Operating System.
                        </p>
                        <p style={{ marginBottom: "16px" }}>
                            I'm still learning. Still building. Still growing. But now, I'm not building alone. I'm building with thousands of developers who believe in the vision.
                        </p>
                    </section>

                    {/* Closing Message */}
                    <div style={{
                        backgroundColor: "#f5f5f5",
                        padding: "24px",
                        borderRadius: "8px",
                        marginTop: "40px",
                        marginBottom: "32px"
                    }}>
                        <p style={{
                            fontSize: "18px",
                            fontWeight: 600,
                            marginBottom: "12px",
                            color: "#1a1a1a"
                        }}>
                            To every young builder reading this:
                        </p>
                        <p style={{
                            fontSize: "16px",
                            lineHeight: "1.7",
                            margin: 0,
                            color: "#333"
                        }}>
                            Don't wait until you're "ready." Don't wait until you're "old enough." Start building today. Your age is your superpower—you have time, energy, and fresh perspectives. The world needs what you're going to create.
                        </p>
                    </div>

                    {/* CTA */}
                    <div style={{
                        textAlign: "center",
                        paddingTop: "32px",
                        borderTop: "1px solid #e5e5e5"
                    }}>
                        <p style={{
                            fontSize: "16px",
                            color: "#666",
                            marginBottom: "16px"
                        }}>
                            Want to be part of the journey?
                        </p>
                        <Link
                            to="/"
                            style={{
                                display: "inline-block",
                                padding: "12px 28px",
                                backgroundColor: "#1a1a1a",
                                color: "#fff",
                                borderRadius: "6px",
                                fontSize: "15px",
                                fontWeight: 600,
                                textDecoration: "none",
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#333";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#1a1a1a";
                            }}
                        >
                            Join Codeown Today
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
}
