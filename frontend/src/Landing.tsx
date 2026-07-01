const STEPS = [
  { n: "01", t: "Submit a versioned manuscript", d: "Post a title, field and abstract, with an optional link to the full text. It enters the journal as version 1 and opens for review, and your authorship is recorded on-chain." },
  { n: "02", t: "The panel reviews each version", d: "A panel of GenLayer validators independently judges the current version's overall merit (quality, novelty and rigor) and returns one of four decisions, each with a written rationale." },
  { n: "03", t: "Revise until it converges", d: "MINOR / MAJOR sends it back: you submit a new version and the loop repeats, up to three rounds. ACCEPT issues a verifiable on-chain credential; REJECT closes the case." },
];

const BANDS = [
  { k: "ACCEPT", n: "merit 80 and up", d: "The work passes. A credential is issued.", c: "--accept" },
  { k: "MINOR", n: "65 to 79", d: "Sound; light revisions requested.", c: "--minor" },
  { k: "MAJOR", n: "45 to 64", d: "Promising; substantial revisions needed.", c: "--major" },
  { k: "REJECT", n: "below 45", d: "Not ready; the case is closed.", c: "--reject" },
];

export function Landing({ onLaunch }: { onLaunch: () => void }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="brand"><img className="glyph" src="/assets/logo.png" alt="" /><div>Lyceum</div></div>
        <div className="links">
          <a onClick={() => go("how")}>How it works</a>
          <a onClick={() => go("bands")}>Decisions</a>
        </div>
        <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={onLaunch}>Launch app →</button>
      </nav>

      <header className="lp-hero">
        <div className="scrim" />
        <div className="lp-hero-inner">
          <span className="lp-kicker">Decentralized peer review · GenLayer</span>
          <h1>Peer review that <span className="accent">revises with you</span>.</h1>
          <p className="lede">
            Lyceum turns review into a transparent, on-chain editorial loop. Submit a manuscript,
            let a panel of GenLayer validators judge each version's merit, and revise until it is
            accepted. You walk away with a <b>verifiable credential</b> instead of an opaque verdict.
          </p>
          <div className="lp-flow">
            {["Submit", "Review", "Revise", "Credential"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="lp-step-chip"><b>{i + 1}</b> {s}</div>
                {i < 3 && <span className="arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="lp-section" id="how">
        <span className="lp-head-eyebrow">How it works</span>
        <h2>An editorial loop, not a verdict</h2>
        <p className="lead">A manuscript is a chain of versions. Each round the panel judges the latest one, and the work either converges to acceptance or is closed, all on-chain.</p>
        <div className="lp-vignette-band" />
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <div className="n">{s.n}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section" id="bands">
        <span className="lp-head-eyebrow">The decision</span>
        <h2>One merit score, four outcomes</h2>
        <p className="lead">Quality, novelty and rigor feed a single overall merit from 0 to 100. The merit decides the round's outcome, and the loop forces convergence by the third round.</p>
        <div className="lp-bands">
          {BANDS.map((b) => (
            <div className="lp-band-card" key={b.k}>
              <div className="bk" style={{ color: `var(${b.c})` }}>{b.k}</div>
              <div className="bn">{b.n}</div>
              <p>{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-cta-band">
          <h2>Submit your first manuscript</h2>
          <p>Post a manuscript, request the panel's review, revise, and earn a verifiable on-chain credential.</p>
          <button className="btn btn-primary" onClick={onLaunch}>Launch the app →</button>
        </div>
        <div className="lp-foot">
          <span>Lyceum, decentralized scientific peer review on GenLayer.</span>
          <span className="mono">Testnet Bradbury · credentials are attestations</span>
        </div>
      </section>
    </div>
  );
}
