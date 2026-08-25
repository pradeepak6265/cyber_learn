"use client";

const learningSections = [
  {
    number: "01",
    title: "Cybersecurity Fundamentals",
    description:
      "Build your foundation with essential cybersecurity concepts, security principles, threats and terminology.",
    topics: "FOUNDATIONS · SECURITY · THREATS",
    icon: "⌁",
  },
  {
    number: "02",
    title: "Web Security",
    description:
      "Understand how web applications work and explore the concepts behind modern web security.",
    topics: "HTTP · WEB APPS · OWASP",
    icon: "</>",
  },
  {
    number: "03",
    title: "Ethical Hacking",
    description:
      "Learn the fundamentals of security testing, reconnaissance and responsible vulnerability research.",
    topics: "RECON · TESTING · VULNERABILITIES",
    icon: "◈",
  },
  {
    number: "04",
    title: "Network Security",
    description:
      "Understand networks, protocols, attacks and defensive techniques used to secure modern systems.",
    topics: "NETWORKS · PROTOCOLS · DEFENSE",
    icon: "⌘",
  },
];

export default function LearningPage() {
  return (
    <main className="learning-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="learning-header">

        <a
          href="/"
          className="brand"
          aria-label="CyberLearn home"
        >
          <span className="brand-mark">◈</span>

          <span className="brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <nav
          className="learning-nav"
          aria-label="Main navigation"
        >
          <a href="/#courses">Courses</a>

          <a href="/#weekly-tests">
            Weekly Tests
          </a>

          <a href="/login">Login</a>
        </nav>

      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="learning-hero">

        <div className="learning-hero-content">

          <div className="learning-kicker">
            <span className="learning-kicker-line" />
            START LEARNING
          </div>

          <h1>
            Learn cybersecurity.
            <br />
            <span>Build real skills.</span>
          </h1>

          <p>
            Choose a learning path and start building
            your cybersecurity knowledge step by step.
            No account required to explore.
          </p>

        </div>

        {/* Decorative terminal */}

        <div className="learning-terminal">

          <div className="terminal-header">
            <span />
            <span />
            <span />

            <small>
              cyberlearn://learning
            </small>
          </div>

          <div className="terminal-body">

            <p>
              <span className="terminal-green">
                $
              </span>{" "}
              start_learning
            </p>

            <p className="terminal-muted">
              Loading knowledge...
            </p>

            <p>
              <span className="terminal-green">
                ✓
              </span>{" "}
              Choose your path
            </p>

            <div className="terminal-progress">
              <span />
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          TOPIC SECTION
      ========================= */}

      <section className="learning-topics-section">

        <div className="learning-section-heading">

          <div>

            <p className="section-label">
              LEARNING PATHS
            </p>

            <h2>
              Where do you want to start?
            </h2>

          </div>

          <p className="topic-count">
            04 TOPICS
          </p>

        </div>

        <div className="learning-grid">

          {learningSections.map(
            (section) => (
              <a
                key={section.number}
                href={`/learning/${section.number}`}
                className="learning-card"
              >

                <div className="learning-card-header">

                  <span className="learning-card-number">
                    {section.number}
                  </span>

                  <span className="learning-card-icon">
                    {section.icon}
                  </span>

                </div>

                <div className="learning-card-body">

                  <h3>
                    {section.title}
                  </h3>

                  <p>
                    {section.description}
                  </p>

                </div>

                <div className="learning-card-footer">

                  <span>
                    {section.topics}
                  </span>

                  <strong>
                    →
                  </strong>

                </div>

              </a>
            )
          )}

        </div>

      </section>

      {/* =========================
          PRACTICE CTA
      ========================= */}

      <section className="practice-section">

        <div className="practice-content">

          <div>

            <p className="section-label practice-label">
              PRACTICE
            </p>

            <h2>
              Test yourself across
              <br />
              <span>all topics.</span>
            </h2>

            <p>
              Not sure where to begin? Practice
              questions from every cybersecurity
              topic in one place.
            </p>

          </div>

          <a
            href="/learning/05"
            className="practice-button"
          >
            Practice All Topics
            <span>↗</span>
          </a>

        </div>

      </section>

    </main>
  );
}