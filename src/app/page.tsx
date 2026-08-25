import UserMenu from "@/components/UserMenu";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const quizModes = [
  {
    number: "01",
    icon: "✦",
    title: "Practice",
    description:
      "Answer questions at your own pace with instant feedback and clear explanations.",
  },
  {
    number: "02",
    icon: "◌",
    title: "Random Quiz",
    description:
      "Test your cybersecurity knowledge across different subjects and topics.",
  },
  {
    number: "03",
    icon: "◇",
    title: "Topic-wise",
    description:
      "Focus your preparation on a specific subject, topic or difficulty level.",
  },
  {
    number: "04",
    icon: "⌁",
    title: "Full Question Bank",
    description:
      "Practice from the complete 10,000-question cybersecurity knowledge bank.",
  },
];

const features = [
  "10,000+ cybersecurity questions",
  "Hindi + English",
  "Instant answer explanations",
  "No timer or countdown",
  "Progress tracking",
  "Bookmarks & wrong questions",
];

export default async function Home() {
  /*
   * Read the authenticated user from the
   * server-side session.
   */
  const currentUser = await getCurrentUser();

  return (
    <main id="top">

      {/* =========================
          HEADER
      ========================= */}

      <header className="site-header">

        <a
          href="#top"
          className="brand"
          aria-label="CyberLearn home"
        >
          <span className="brand-mark">
            ◈
          </span>

          <span className="brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          <a href="/content">
            Content
          </a>

          <a href="#weekly-tests">
            Weekly Tests
          </a>

          {currentUser ? (
            /*
             * Logged-in user:
             * show user initial instead of
             * Login + Join free.
             */
            <UserMenu
              firstName={
                currentUser.firstName
              }
            />
          ) : (
            /*
             * Logged-out user:
             * show Login + Join free.
             */
            <>
              <a href="/login">
                Login
              </a>

              <a
                href="/signup"
                className="signup-link"
              >
                Join free
              </a>
            </>
          )}
        </nav>

        {/*
         * Mobile:
         * Login is shown only when logged out.
         */}
        {!currentUser && (
          <a
            href="/login"
            className="mobile-login"
          >
            Login
          </a>
        )}

      </header>

      {/* =========================
          HERO
      ========================= */}

      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-copy">

            <p className="eyebrow">
              <span className="eyebrow-dot" />
              CYBERSECURITY · LEARNING PLATFORM
            </p>

            <h1>
              Learn.
              <br />
              Practise.
              <br />
              <em>Know more.</em>
            </h1>

            <p className="hero-description">
              A focused question-based learning
              space to build and test your
              cybersecurity knowledge, one
              question at a time.
            </p>

            <div className="hero-actions">

              <a
                href="/learning"
                className="primary-button"
              >
                Start learning{" "}
                <span>↗</span>
              </a>

              <a
                href="/weekly-tests"
                className="secondary-button"
              >
                Weekly tests{" "}
                <span>↓</span>
              </a>

            </div>

            <div className="hero-proof">

              <div className="proof-icons">
                <span>✦</span>
                <span>◌</span>
                <span>◇</span>
              </div>

              <p>
                One academy. Every question.
                <br />
                <strong>
                  Learn at your own pace.
                </strong>
              </p>

            </div>

          </div>

          {/* =========================
              HERO VISUAL
          ========================= */}

          <div className="hero-visual">

            <div className="grid-background" />

            <div className="floating-card floating-card-one">
              <strong>10K</strong>
              <small>QUESTIONS</small>
            </div>

            <div className="floating-card floating-card-two">
              <strong>₹21</strong>
              <small>ONE TIME</small>
            </div>

            <div className="terminal-window">

              <div className="terminal-header">

                <div className="terminal-dots">
                  <i />
                  <i />
                  <i />
                </div>

                <span>
                  question_review
                </span>

                <b>
                  LIVE
                </b>

              </div>

              <div className="terminal-body">

                <p>
                  <span className="terminal-green">
                    $
                  </span>{" "}
                  choose_your_topic()
                </p>

                <p className="terminal-muted">
                  → loading practice questions...
                </p>

                <p>
                  <span className="terminal-green">
                    ✓
                  </span>{" "}
                  explanation ready
                </p>

                <p>
                  <span className="terminal-green">
                    $
                  </span>{" "}
                  check_your_answer()
                </p>

                <p className="terminal-muted">
                  → keep learning_
                </p>

              </div>

            </div>

            <div className="visual-label visual-label-top">
              LEARN

              <strong>
                ONE
                <br />
                QUESTION
                <br />
                AT A TIME
              </strong>
            </div>

            <div className="visual-label visual-label-bottom">
              PRACTICE / REVIEW
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          INFORMATION STRIP
      ========================= */}

      <section className="trust-strip">

        <span>
          10,000+ QUESTIONS
        </span>

        <i />

        <span>
          HINDI + ENGLISH
        </span>

        <i />

        <span>
          NO TIMER
        </span>

        <i />

        <span>
          INSTANT FEEDBACK
        </span>

      </section>

      {/* =========================
          PRACTICE SPACE
      ========================= */}

      <section className="intro-section">

        <div>

          <p className="eyebrow">
            YOUR PRACTICE SPACE
          </p>

          <h2>
            Learn at
            <br />
            <em>your pace.</em>
          </h2>

        </div>

        <div>

          <p className="intro-description">
            Choose a topic, answer questions,
            read the explanation, and keep
            moving forward with a clear record
            of your progress.
          </p>

          <div className="intro-points">

            <span>
              <b>↗</b> Topic-wise practice
            </span>

            <span>
              <b>◌</b> Practice questions
            </span>

            <span>
              <b>◇</b> Answer explanations
            </span>

            <span>
              <b>✦</b> Progress tracking
            </span>

          </div>

        </div>

      </section>

      {/* =========================
          COURSES
      ========================= */}

      <section
        id="courses"
        className="modes-section"
      >

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              START LEARNING
            </p>

            <h2>
              Find your
              <br />
              <em>next question.</em>
            </h2>

          </div>

          <p>
            Build knowledge through focused
            question sets, simple explanations
            and steady practice across
            cybersecurity subjects.
          </p>

        </div>

        <div className="mode-grid">

          {quizModes.map((mode) => (

            <a
              href="#product"
              className="mode-card"
              key={mode.number}
            >

              <span className="mode-number">
                {mode.number}
              </span>

              <span className="mode-icon">
                {mode.icon}
              </span>

              <h3>
                {mode.title}
              </h3>

              <p>
                {mode.description}
              </p>

              <span className="mode-link">
                Start learning{" "}
                <b>↗</b>
              </span>

            </a>

          ))}

        </div>

      </section>

      {/* =========================
          WEEKLY TESTS
      ========================= */}

      <section
        id="weekly-tests"
        className="weekly-section"
      >

        <div>

          <p className="eyebrow">
            THE ACADEMY PROMISE
          </p>

          <h2>
            Less pressure.
            <br />
            <em>More practice.</em>
          </h2>

        </div>

        <div className="weekly-copy">

          <p>
            Answer questions, see the correct
            answer with a short explanation,
            and build a stronger cybersecurity
            foundation at your own pace.
          </p>

          <span className="coming-label">
            WEEKLY TESTS · COMING SOON
          </span>

        </div>

      </section>

      {/* =========================
          PRODUCT
      ========================= */}

      <section
        id="product"
        className="product-section"
      >

        <div className="product-content">

          <div className="product-copy">

            <p className="eyebrow warm">
              FIRST PRODUCT
            </p>

            <h2>
              10,000
              <br />
              <em>MCQs.</em>
            </h2>

            <p>
              A complete cybersecurity question
              bank for practice, revision and
              continuous learning.
            </p>

            <div className="feature-list">

              {features.map((feature) => (

                <span key={feature}>

                  <b>✓</b>

                  {feature}

                </span>

              ))}

            </div>

          </div>

          <div className="price-card">

            <span className="price-label">
              ONE-TIME ACCESS
            </span>

            <div className="price">

              <small>₹</small>

              21

            </div>

            <p>
              No subscription. No expiry.
            </p>

            <a
              href="/login"
              className="price-button"
            >
              Unlock the Quiz{" "}
              <span>↗</span>
            </a>

            <small className="secure-note">
              Secure payment powered by Razorpay
            </small>

          </div>

        </div>

      </section>

      {/* =========================
          FEATURES
      ========================= */}

      <section className="features-section">

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              BUILT FOR LEARNERS
            </p>

            <h2>
              More practice.
              <br />
              <em>Better preparation.</em>
            </h2>

          </div>

          <p>
            Built to grow from the first
            10,000-question product into a
            complete cybersecurity quiz and
            test-series platform.
          </p>

        </div>

        <div className="feature-grid">

          <div>

            <span>01</span>

            <h3>
              Instant Feedback
            </h3>

            <p>
              See whether your answer is
              correct and understand why with
              a short explanation.
            </p>

          </div>

          <div>

            <span>02</span>

            <h3>
              Track Progress
            </h3>

            <p>
              Keep attempts, scores,
              bookmarks and wrong questions
              in one place.
            </p>

          </div>

          <div>

            <span>03</span>

            <h3>
              Two Languages
            </h3>

            <p>
              Switch between Hindi and
              English while keeping the same
              learning experience.
            </p>

          </div>

          <div>

            <span>04</span>

            <h3>
              Built to Scale
            </h3>

            <p>
              Future chapter tests, mock
              tests, PYQs and full syllabus
              tests can be added without
              rebuilding the platform.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FINAL CTA
      ========================= */}

      <section className="final-cta">

        <p className="eyebrow">
          START TODAY
        </p>

        <h2>
          Your cybersecurity
          <br />
          <em>practice starts here.</em>
        </h2>

        <p>
          10,000 questions. Hindi + English.
          No timer. Learn at your own pace.
        </p>

        <a
          href="#product"
          className="primary-button"
        >
          Explore 10,000 MCQs{" "}
          <span>↗</span>
        </a>

      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="site-footer">

        <a
          href="#top"
          className="brand"
        >
          <span className="brand-mark">
            ◈
          </span>

          <span className="brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <p>
          © 2026 CyberLearn. Learn with intent.
        </p>

        <div className="footer-links">

          <a href="#">
            Privacy
          </a>

          <a href="#">
            Terms
          </a>

          {!currentUser && (
            <a href="/login">
              Login
            </a>
          )}

        </div>

      </footer>

    </main>
  );
}
