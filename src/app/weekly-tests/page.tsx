"use client";

import { useState } from "react";

type TestType = "free" | "paid";

type FreeTest = {
  number: string;
  questions: number;
  difficulty: string;
  topics: string;
  description: string;
};

type PaidTest = {
  number: string;
  questions: number;
  difficulty: string;
  topics: string;
  price: string;
  description: string;
};

const freeTests: FreeTest[] = [
  {
    number: "01",
    questions: 25,
    difficulty: "Beginner",
    topics: "Cybersecurity Fundamentals",
    description:
      "Test your understanding of essential cybersecurity concepts, terminology and basic security principles.",
  },
  {
    number: "02",
    questions: 25,
    difficulty: "Beginner",
    topics: "Web Security",
    description:
      "Practice fundamental concepts related to web applications, common vulnerabilities and web security.",
  },
  {
    number: "03",
    questions: 30,
    difficulty: "Intermediate",
    topics: "Network Security",
    description:
      "Check your knowledge of networks, protocols, threats and important network security concepts.",
  },
  {
    number: "04",
    questions: 30,
    difficulty: "Intermediate",
    topics: "Ethical Hacking",
    description:
      "Test your understanding of penetration testing, reconnaissance and ethical hacking fundamentals.",
  },
];

const paidTests: PaidTest[] = [
  {
    number: "01",
    questions: 100,
    difficulty: "Advanced",
    topics: "Full Cybersecurity",
    price: "₹21",
    description:
      "A comprehensive cybersecurity test covering multiple security domains with carefully selected questions.",
  },
  {
    number: "02",
    questions: 100,
    difficulty: "Advanced",
    topics: "Web & Network Security",
    price: "₹21",
    description:
      "Challenge yourself with advanced questions covering web applications and network security concepts.",
  },
  {
    number: "03",
    questions: 150,
    difficulty: "Advanced",
    topics: "Ethical Hacking",
    price: "₹29",
    description:
      "Advanced practice covering ethical hacking, penetration testing and practical security concepts.",
  },
  {
    number: "04",
    questions: 150,
    difficulty: "Expert",
    topics: "Complete Security",
    price: "₹49",
    description:
      "A high-level cybersecurity assessment designed for deeper preparation across multiple security domains.",
  },
];

export default function WeeklyTestsPage() {
  const [activeTestType, setActiveTestType] =
    useState<TestType>("free");

  const activeTests =
    activeTestType === "free"
      ? freeTests
      : paidTests;

  return (
    <main className="weekly-tests-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="weekly-tests-header">

        <a
          href="/"
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
          className="weekly-tests-nav"
          aria-label="Main navigation"
        >
          <a href="/#courses">
            Courses
          </a>

          <a
            href="/weekly-tests"
            className="active-nav-link"
          >
            Weekly Tests
          </a>

          <a href="/login">
            Login
          </a>
        </nav>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="weekly-tests-hero">

        <div className="weekly-tests-hero-content">

          <div className="weekly-tests-kicker">
            <span />
            WEEKLY TESTS
          </div>

          <h1>
            Test your
            <br />
            <span>knowledge.</span>
          </h1>

          <p>
            Practice your cybersecurity knowledge with
            carefully structured tests. Start with a free
            test or unlock advanced tests when you are
            ready for more.
          </p>

        </div>

        {/* Hero Statistics */}

        <div className="test-stat-panel">

          <div className="test-stat">

            <strong>
              {freeTests.length}
            </strong>

            <span>
              FREE TESTS
            </span>

          </div>

          <div className="stat-divider" />

          <div className="test-stat">

            <strong>
              {paidTests.length}
            </strong>

            <span>
              PAID TESTS
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          TEST SECTION
      ===================================================== */}

      <section className="tests-section">

        {/* ===================================================
            FREE / PAID SWITCHER
        =================================================== */}

        <div className="test-type-switcher">

          {/* FREE TAB */}

          <button
            type="button"
            className={`test-type-tab ${
              activeTestType === "free"
                ? "active"
                : "inactive"
            }`}
            onClick={() =>
              setActiveTestType("free")
            }
          >

            <div className="test-type-tab-left">

              <span className="test-type-dot free-tab-dot" />

              <div>

                <span className="test-type-label">
                  FREE TESTS
                </span>

                <strong>
                  Start practicing for free.
                </strong>

              </div>

            </div>

            <span className="test-type-arrow">
              ↗
            </span>

          </button>

          {/* PAID TAB */}

          <button
            type="button"
            className={`test-type-tab paid-tab ${
              activeTestType === "paid"
                ? "active"
                : "inactive"
            }`}
            onClick={() =>
              setActiveTestType("paid")
            }
          >

            <div className="test-type-tab-left">

              <span className="test-type-dot paid-tab-dot" />

              <div>

                <span className="test-type-label">
                  PAID TESTS
                </span>

                <strong>
                  Go deeper with advanced tests.
                </strong>

              </div>

            </div>

            <span className="test-type-arrow">
              ↗
            </span>

          </button>

        </div>

        {/* ===================================================
            ACTIVE SECTION HEADING
        =================================================== */}

        <div className="active-tests-heading">

          <div>

            <div className="tests-section-label">

              <span
                className={
                  activeTestType === "free"
                    ? "free-dot"
                    : "paid-dot"
                }
              />

              {activeTestType === "free"
                ? "FREE TESTS"
                : "PAID TESTS"}

            </div>

            <h2>
              {activeTestType === "free"
                ? "Start practicing for free."
                : "Go deeper with advanced tests."}
            </h2>

            <p>
              {activeTestType === "free"
                ? "Open to everyone. No payment required."
                : "Unlock premium tests and challenge yourself."}
            </p>

          </div>

          <span className="tests-section-count">
            {activeTests.length} AVAILABLE
          </span>

        </div>

        {/* ===================================================
            PRODUCT CARD GRID
        =================================================== */}

        <div className="tests-card-grid">

          {activeTests.map((test) => (

            <a
              key={test.number}
              href={
                activeTestType === "free"
                  ? `/weekly-tests/free/${test.number}`
                  : `/weekly-tests/paid/${test.number}`
              }
              className="test-product-card"
            >

              {/* Card Top */}

              <div className="test-product-top">

                <span
                  className={
                    activeTestType === "free"
                      ? "test-product-label free-label"
                      : "test-product-label paid-label"
                  }
                >
                  {activeTestType === "free"
                    ? "FREE TEST"
                    : "PAID TEST"}
                </span>

                <span className="test-product-number">
                  TEST {test.number}
                </span>

              </div>

              {/* Card Title */}

              <h3>
                Test {test.number}
              </h3>

              {/* Card Description */}

              <p className="test-product-description">
                {test.description}
              </p>

              {/* Card Details */}

              <ul className="test-product-details">

                <li>
                  {test.questions} Questions
                </li>

                <li>
                  {test.difficulty} Level
                </li>

                <li>
                  {test.topics}
                </li>

              </ul>

              {/* Card Bottom */}

              <div className="test-product-bottom">

                {/* Price */}

                <div className="test-product-price">

                  {activeTestType === "free" ? (

                    <>
                      <strong>
                        FREE
                      </strong>

                      <span>
                        Open to everyone
                      </span>
                    </>

                  ) : (

                    <>
                      <strong>
                        {(test as PaidTest).price}
                      </strong>

                      <span>
                        One-time access
                      </span>
                    </>

                  )}

                </div>

                {/* Button */}

                <div className="test-product-button">

                  <span>
                    {activeTestType === "free"
                      ? "Start Test"
                      : "Unlock Test"}
                  </span>

                  <strong>
                    ↗
                  </strong>

                </div>

              </div>

            </a>

          ))}

        </div>

      </section>

      {/* =====================================================
          INFORMATION NOTE
      ===================================================== */}

      <section className="tests-note-section">

        <div className="tests-note">

          <div className="tests-note-icon">
            ✓
          </div>

          <div>

            <h3>
              Practice at your own pace.
            </h3>

            <p>
              There is no countdown timer. Take your
              time, think through each question and
              focus on understanding the concepts.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}