"use client";

type ContentItem = {
  title: string;
  description: string;
  type: string;
  category: string;
  href: string;
  theme: string;
};

const contentItems: ContentItem[] = [
  {
    title: "SOC L1 Job Ready Study Material",
    description:
      "Structured study material covering the core concepts and skills required to start preparing for a SOC Analyst Level 1 role.",
    type: "STUDY MATERIAL",
    category: "SOC & DEFENSIVE SECURITY",
    href: "/content/soc-l1",
    theme: "green",
  },

  {
    title: "Complete Cybersecurity Fundamentals in One PDF",
    description:
      "A complete beginner-friendly resource covering essential cybersecurity concepts, terminology, threats and security principles.",
    type: "PDF RESOURCE",
    category: "CYBERSECURITY FUNDAMENTALS",
    href: "/content/cybersecurity-fundamentals",
    theme: "blue",
  },

  {
    title: "Bug Bounty Requirements & Roadmap",
    description:
      "Understand the knowledge, skills, tools and security concepts needed to start learning bug bounty and web security.",
    type: "ROADMAP",
    category: "BUG BOUNTY",
    href: "/content/bug-bounty",
    theme: "purple",
  },

  {
    title: "Web Security Study Material",
    description:
      "Learn important web application security concepts including authentication, sessions, access control and common vulnerabilities.",
    type: "STUDY MATERIAL",
    category: "WEB SECURITY",
    href: "/content/web-security",
    theme: "orange",
  },

  {
    title: "Ethical Hacking Study Material",
    description:
      "Explore ethical hacking fundamentals, reconnaissance, vulnerability assessment and security testing concepts.",
    type: "GUIDE",
    category: "ETHICAL HACKING",
    href: "/content/ethical-hacking",
    theme: "red",
  },

  {
    title: "Network Security Study Material",
    description:
      "Build your understanding of networking and security concepts including protocols, ports, firewalls, VPNs and threats.",
    type: "STUDY MATERIAL",
    category: "NETWORK SECURITY",
    href: "/content/network-security",
    theme: "cyan",
  },

  {
    title: "CTF & Practical Security Resources",
    description:
      "Practical resources to improve your cybersecurity problem-solving skills through challenges, labs and hands-on practice.",
    type: "PRACTICAL",
    category: "CTF & LABS",
    href: "/content/ctf-resources",
    theme: "yellow",
  },

  {
    title: "Cybersecurity Interview Preparation",
    description:
      "Prepare for cybersecurity, SOC and security analyst interviews with important concepts, questions and preparation resources.",
    type: "INTERVIEW GUIDE",
    category: "CAREER",
    href: "/content/interview-preparation",
    theme: "pink",
  },
];

export default function ContentPage() {
  return (
    <main className="content-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="content-header">

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
          className="content-nav"
          aria-label="Main navigation"
        >
          <a
            href="/content"
            className="content-active-nav"
          >
            Content
          </a>

          <a href="/weekly-tests">
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

      <section className="content-hero">

        <div className="content-hero-inner">

          <div className="content-kicker">
            <span />
            CYBERSECURITY CONTENT
          </div>

          <h1>
            Learn.
            <br />
            <em>Explore.</em>
            <br />
            Grow.
          </h1>

          <p>
            Explore cybersecurity study material, guides,
            roadmaps and practical resources designed to
            help you build real security knowledge.
          </p>

        </div>


        <div className="content-hero-mark">

          <div className="content-orbit orbit-one" />
          <div className="content-orbit orbit-two" />

          <span>
            CYBER
          </span>

        </div>

      </section>


      {/* =====================================================
          CONTENT SECTION
      ===================================================== */}

      <section className="content-library">

        <div className="content-library-heading">

          <div>

            <div className="content-section-label">
              <span />
              LEARNING RESOURCES
            </div>

            <h2>
              Explore our content.
            </h2>

            <p>
              Select a resource to start learning.
              More study material will be added regularly.
            </p>

          </div>

          <span className="content-count">
            {contentItems.length} RESOURCES
          </span>

        </div>


        {/* ===================================================
            CONTENT CARD GRID
        =================================================== */}

        <div className="content-card-grid">

          {contentItems.map((item) => (

            <a
              key={item.title}
              href={item.href}
              className={`content-card content-card-${item.theme}`}
            >

              {/* Card top */}

              <div className="content-card-top">

                <span className="content-card-category">
                  {item.category}
                </span>

                <span className="content-card-arrow">
                  ↗
                </span>

              </div>


              {/* Decorative icon */}

              <div className="content-card-symbol">
                <span />
                <span />
                <span />
              </div>


              {/* Content */}

              <div className="content-card-body">

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.description}
                </p>

              </div>


              {/* Bottom */}

              <div className="content-card-bottom">

                <span className="content-type">
                  {item.type}
                </span>

                <span className="content-open">
                  Open Resource
                  <strong>
                    →
                  </strong>
                </span>

              </div>

            </a>

          ))}

        </div>

      </section>


      {/* =====================================================
          BOTTOM NOTE
      ===================================================== */}

      <section className="content-note-section">

        <div className="content-note">

          <div className="content-note-icon">
            +
          </div>

          <div>

            <h3>
              More cybersecurity resources are coming.
            </h3>

            <p>
              New study materials, guides, practical resources
              and preparation content will be added over time.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}