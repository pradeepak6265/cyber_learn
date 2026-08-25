import { requireUser } from "@/lib/auth";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();

  const firstName = user.firstName.trim();

  return (
    <main className="dashboard-page">

      <header className="dashboard-header">
        <a
          href="/"
          className="dashboard-brand"
          aria-label="CyberLearn home"
        >
          <span className="dashboard-brand-mark">
            ◈
          </span>

          <span className="dashboard-brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <nav
          className="dashboard-nav"
          aria-label="Dashboard navigation"
        >
          <a href="/">Home</a>
          <a href="/content">Content</a>
          <a href="/weekly-tests">
            Weekly Tests
          </a>
          <a href="/account-settings">
            Account Settings
          </a>
        </nav>
      </header>

      <section className="dashboard-container">

        {/* WELCOME */}

        <div className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">
              YOUR DASHBOARD
            </p>

            <h1>
              Welcome back,{" "}
              <em>{firstName}</em>.
            </h1>

            <p>
              Continue your cybersecurity
              learning and keep building your
              knowledge.
            </p>
          </div>

          <div className="dashboard-user-card">
            <div className="dashboard-user-initial">
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.firstName}{" "}
                {user.surname}
              </strong>

              <span>
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* PROGRESS */}

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                YOUR PROGRESS
              </p>

              <h2>
                Learning overview
              </h2>
            </div>
          </div>

          <div className="dashboard-stat-grid">

            <div className="dashboard-stat-card">
              <span>
                QUESTIONS ATTEMPTED
              </span>

              <strong>—</strong>

              <p>
                Your practice activity
                will appear here.
              </p>
            </div>

            <div className="dashboard-stat-card">
              <span>
                CORRECT ANSWERS
              </span>

              <strong>—</strong>

              <p>
                Correct answers will be
                tracked here.
              </p>
            </div>

            <div className="dashboard-stat-card">
              <span>
                ACCURACY
              </span>

              <strong>—</strong>

              <p>
                Your overall accuracy
                will appear here.
              </p>
            </div>

            <div className="dashboard-stat-card">
              <span>
                QUESTIONS REMAINING
              </span>

              <strong>—</strong>

              <p>
                Complete question-bank
                progress will appear here.
              </p>
            </div>

          </div>
        </section>

        {/* CONTINUE LEARNING */}

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                CONTINUE LEARNING
              </p>

              <h2>
                Pick up where you left off.
              </h2>
            </div>
          </div>

          <div className="dashboard-continue-card">
            <div>
              <span className="dashboard-card-label">
                PRACTICE
              </span>

              <h3>
                Start your cybersecurity
                practice
              </h3>

              <p>
                Choose a topic and start
                answering questions at your
                own pace.
              </p>
            </div>

            <a
              href="/learning"
              className="dashboard-primary-button"
            >
              Continue Practice
              <span>↗</span>
            </a>
          </div>
        </section>

        {/* TOPICS */}

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                TOPIC PROGRESS
              </p>

              <h2>
                Your subjects
              </h2>
            </div>

            <a
              href="/learning"
              className="dashboard-section-link"
            >
              View all →
            </a>
          </div>

          <div className="dashboard-topic-grid">
            <TopicCard title="Web Security" />
            <TopicCard title="Network Security" />
            <TopicCard title="Cryptography" />
            <TopicCard title="Linux" />
            <TopicCard title="OWASP" />
            <TopicCard title="Cybersecurity Basics" />
          </div>
        </section>

        {/* ACTIVITY + WRONG QUESTIONS */}

        <section className="dashboard-two-column">

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <p className="dashboard-eyebrow">
                RECENT ACTIVITY
              </p>

              <h2>
                Your activity
              </h2>
            </div>

            <div className="dashboard-empty-state">
              <span>◌</span>

              <h3>
                No activity yet
              </h3>

              <p>
                Start practicing to see your
                recent learning activity here.
              </p>

              <a
                href="/learning"
                className="dashboard-text-button"
              >
                Start learning →
              </a>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <p className="dashboard-eyebrow">
                REVIEW
              </p>

              <h2>
                Wrong questions
              </h2>
            </div>

            <div className="dashboard-empty-state">
              <span>✓</span>

              <h3>
                Nothing to review
              </h3>

              <p>
                Questions answered incorrectly
                will appear here for revision.
              </p>

              <a
                href="/learning"
                className="dashboard-text-button"
              >
                Practice questions →
              </a>
            </div>
          </div>

        </section>

        {/* BOOKMARKS + WEEKLY TESTS */}

        <section className="dashboard-two-column">

          <div className="dashboard-action-card">
            <div>
              <span className="dashboard-card-label">
                BOOKMARKS
              </span>

              <h3>
                Saved questions
              </h3>

              <p>
                Questions you bookmark for
                later revision will appear here.
              </p>
            </div>

            <a
              href="/learning"
              className="dashboard-secondary-button"
            >
              View bookmarks →
            </a>
          </div>

          <div className="dashboard-action-card">
            <div>
              <span className="dashboard-card-label">
                WEEKLY TESTS
              </span>

              <h3>
                Keep an eye on upcoming tests.
              </h3>

              <p>
                Weekly tests and future test
                series will be available here.
              </p>
            </div>

            <a
              href="/weekly-tests"
              className="dashboard-secondary-button"
            >
              View tests →
            </a>
          </div>

        </section>

        {/* ACCOUNT */}

        <section className="dashboard-account-card">
          <div>
            <p className="dashboard-eyebrow">
              ACCOUNT
            </p>

            <h2>
              {user.firstName}{" "}
              {user.surname}
            </h2>

            <p>
              {user.email}
            </p>
          </div>

          <a
            href="/account-settings"
            className="dashboard-primary-button"
          >
            Account Settings
            <span>↗</span>
          </a>
        </section>

      </section>

      {/* FOOTER */}

      <footer className="dashboard-footer">

        <a
          href="/"
          className="dashboard-brand"
        >
          <span className="dashboard-brand-mark">
            ◈
          </span>

          <span className="dashboard-brand-wordmark">
            cyber<span>learn</span>
          </span>
        </a>

        <p>
          © 2026 CyberLearn. Learn with intent.
        </p>

        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>

      </footer>

    </main>
  );
}


/* =========================
   TOPIC CARD
========================= */

function TopicCard({
  title,
}: {
  title: string;
}) {
  return (
    <div className="dashboard-topic-card">

      <div className="dashboard-topic-top">
        <span>{title}</span>
        <strong>—</strong>
      </div>

      <div className="dashboard-progress-track">
        <div
          className="dashboard-progress-bar"
          style={{
            width: "0%",
          }}
        />
      </div>

      <p>
        No questions attempted yet.
      </p>

    </div>
  );
}