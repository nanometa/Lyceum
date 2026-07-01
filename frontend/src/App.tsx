import { useCallback, useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  type SubmissionFull, type SubmissionCard, type Version, type RoundDecision,
  type Credential, type Stats, type SubStatus, type Decision,
  submitManuscript, reviewRound, resubmit,
  getSubmission, getVersions, getDecisions, getCredential, listRecent, reviewStats,
} from "./contractService";

type Hex = `0x${string}`;
const DEMO_SUB = 1;
const AXES = ["quality", "novelty", "rigor"] as const;
const short = (a: string) => (a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);
const eq = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

function LogoMark() {
  const [ok, setOk] = useState(true);
  return ok ? <img className="glyph" src="/assets/logo.png" alt="" onError={() => setOk(false)} /> : <span className="glyph">L</span>;
}
function StatusPill({ status }: { status: SubStatus }) {
  return <span className={`pill st-${status || "UNDER_REVIEW"}`}>{(status || "pending").replace("_", " ")}</span>;
}
function DecisionPill({ d }: { d: Decision }) {
  if (!d) return null;
  return <span className={`dec dec-${d}`}>{d}</span>;
}
function MeritAxes({ d }: { d: RoundDecision }) {
  return (
    <div className="merit-wrap">
      <div className="merit">{d.merit}<small>merit</small></div>
      <div className="axes">
        {AXES.map((ax) => {
          const v = (d as any)[ax] as number;
          return (
            <div className="axis" key={ax}>
              <span className="name">{ax}</span>
              <span className="track"><i className="fill" style={{ width: `${v}%` }} /></span>
              <span className="num">{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function App({ onBack }: { onBack?: () => void }) {
  const { address, isConnected } = useAccount();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<SubmissionCard[]>([]);
  const [cur, setCur] = useState<SubmissionFull | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [decisions, setDecisions] = useState<RoundDecision[]>([]);
  const [cred, setCred] = useState<Credential | null>(null);
  const [loadId, setLoadId] = useState(String(DEMO_SUB));
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  // submit form
  const [sTitle, setSTitle] = useState("");
  const [sField, setSField] = useState("");
  const [sAbstract, setSAbstract] = useState("");
  const [sUrl, setSUrl] = useState("");
  // resubmit form
  const [rAbstract, setRAbstract] = useState("");
  const [rUrl, setRUrl] = useState("");
  const [rNote, setRNote] = useState("");

  const refreshGlobal = useCallback(async () => {
    let [s, r] = await Promise.all([reviewStats(), listRecent(25)]);
    for (let i = 0; i < 2 && s.totalSubmissions === 0 && r.length === 0; i++) {
      await new Promise((res) => setTimeout(res, 1500));
      [s, r] = await Promise.all([reviewStats(), listRecent(25)]);
    }
    setStats(s); setRecent(r);
  }, []);

  const loadSub = useCallback(async (id: number) => {
    if (id < 0 || Number.isNaN(id)) return;
    setBusy(`Loading submission #${id}…`);
    try {
      let s = await getSubmission(id);
      for (let i = 0; i < 3 && !s; i++) { await new Promise((res) => setTimeout(res, 1500)); s = await getSubmission(id); }
      let [v, d] = await Promise.all([getVersions(id), getDecisions(id)]);
      let c = await getCredential(id);
      for (let i = 0; i < 3; i++) {
        const needV = !!s && v.length === 0;                    // a submission always has >=1 version
        const needD = !!s && !!s.lastDecision && d.length === 0; // a review happened but decisions read empty
        const needC = !!s?.accepted && !(c && c.issued);        // accepted but credential read missing
        if (!needV && !needD && !needC) break;
        await new Promise((res) => setTimeout(res, 1500));
        if (needV) v = await getVersions(id);
        if (needD) d = await getDecisions(id);
        if (needC) c = await getCredential(id);
      }
      setCur(s); setVersions(v); setDecisions(d); setCred(c);
      setRAbstract(""); setRUrl(""); setRNote("");
      if (s) setErr(""); else setErr(`No submission #${id} found.`);
    } finally { setBusy(""); }
  }, []);

  useEffect(() => { refreshGlobal(); loadSub(DEMO_SUB); }, [refreshGlobal, loadSub]);

  const onSubmit = async () => {
    if (!address) return;
    setErr(""); setBusy("Submitting your manuscript on-chain…");
    try {
      const id = await submitManuscript(address as Hex, sTitle, sField, sAbstract, sUrl);
      setSTitle(""); setSField(""); setSAbstract(""); setSUrl("");
      await refreshGlobal(); setLoadId(String(id)); await loadSub(id);
    } catch (e: any) { setErr(e?.message || "Submit failed"); } finally { setBusy(""); }
  };
  const onReview = async () => {
    if (!address || !cur) return;
    setErr(""); setBusy("The validator panel is reviewing this version. AI judging can take a few minutes…");
    try { await reviewRound(address as Hex, cur.id); await loadSub(cur.id); await refreshGlobal(); }
    catch (e: any) { setErr(e?.message || "Review failed"); } finally { setBusy(""); }
  };
  const onResubmit = async () => {
    if (!address || !cur) return;
    setErr(""); setBusy("Submitting your revised version…");
    try { await resubmit(address as Hex, cur.id, rAbstract, rUrl, rNote); await loadSub(cur.id); await refreshGlobal(); }
    catch (e: any) { setErr(e?.message || "Resubmit failed"); } finally { setBusy(""); }
  };

  const isAuthor = cur && eq(address, cur.author);
  const canReview = cur?.status === "UNDER_REVIEW";
  const canResubmit = cur?.status === "REVISE" && isAuthor;
  const latest = decisions.length ? decisions[decisions.length - 1] : null;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand"><LogoMark /><div>Lyceum<small>DECENTRALIZED PEER REVIEW</small></div></div>
        <div className="spacer" />
        {onBack && <button className="back-btn" onClick={onBack}>← Tutorial</button>}
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
      </div>

      <div className="wrap grid cols">
        {/* ---------------- left: submit + lookup + court ---------------- */}
        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          <div className="panel">
            <h3>Open a submission</h3>
            <p className="sub">View any submission by its id.</p>
            <div className="field" style={{ display: "flex", gap: 10 }}>
              <input value={loadId} onChange={(e) => setLoadId(e.target.value)} placeholder="1" style={{ width: 90 }} className="mono" />
              <button className="btn" disabled={!!busy} onClick={() => loadSub(parseInt(loadId, 10))}>Load</button>
            </div>
          </div>

          <div className="panel">
            <h3>Submit a manuscript</h3>
            <p className="sub">You are the author. The panel reviews v1; revise and resubmit until a decision.</p>
            <div className="field"><label>Title</label>
              <input value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="e.g. Confidence-Weighted Median Aggregation…" /></div>
            <div className="field"><label>Field</label>
              <input value={sField} onChange={(e) => setSField(e.target.value)} placeholder="e.g. Distributed Systems" /></div>
            <div className="field"><label>Abstract</label>
              <textarea value={sAbstract} onChange={(e) => setSAbstract(e.target.value)} placeholder="Contribution, method, results…" /></div>
            <div className="field mono-in"><label>Manuscript URL <span className="faint">(optional)</span></label>
              <input value={sUrl} onChange={(e) => setSUrl(e.target.value)} placeholder="https://… (text/HTML the panel can fetch)" /></div>
            {isConnected
              ? <button className="btn btn-primary btn-block" disabled={!!busy || sTitle.trim().length < 3 || sAbstract.trim().length < 16} onClick={onSubmit}>Submit for review →</button>
              : <ConnectButton.Custom>{({ openConnectModal }) => (<button className="btn btn-block" onClick={openConnectModal}>Connect wallet to submit</button>)}</ConnectButton.Custom>}
          </div>

          <div className="panel">
            <h3>Journal</h3>
            <div className="metarow" style={{ marginTop: 4 }}>
              <span className="chip">Submissions <b>{stats?.totalSubmissions ?? 0}</b></span>
              <span className="chip">Accepted <b>{stats?.totalAccepted ?? 0}</b></span>
              <span className="chip">Rounds <b>{stats?.totalRounds ?? 0}</b></span>
            </div>
            <div className="divider" />
            <div className="sub" style={{ margin: 0 }}>Recent submissions</div>
            {recent.length === 0 && <div className="empty">No submissions yet.</div>}
            {recent.map((c) => (
              <div className="sub-row" key={c.id} onClick={() => { setLoadId(String(c.id)); loadSub(c.id); }}>
                <div className="sid">#{c.id}</div>
                <div><div className="st">{c.title || "Untitled"}</div><div className="sp">{short(c.author)} · {c.field || "n/a"}</div></div>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- right: submission view ---------------- */}
        <div className="grid" style={{ alignContent: "start", gap: 18 }}>
          {err && <div className="banner warn">{err}</div>}

          {cur ? (
            <div className="panel">
              <div className="eyebrow">Submission #{cur.id}</div>
              <div className="sub-head" style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
                <h2>{cur.title}</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusPill status={cur.status} />
                  {cur.lastDecision && <DecisionPill d={cur.lastDecision} />}
                </div>
              </div>
              <div className="metarow">
                <span className="chip">Author <b>{short(cur.author)}</b></span>
                <span className="chip">Field <b>{cur.field || "n/a"}</b></span>
                <span className="chip">Round <b>{cur.round}/{cur.maxRounds}</b></span>
                <span className="chip">Versions <b>{cur.versionCount}</b></span>
              </div>

              {latest ? <MeritAxes d={latest} /> : <div className="banner info" style={{ marginTop: 14 }}>Awaiting the first review round.</div>}

              {/* contextual actions */}
              {canReview && (
                <div style={{ marginTop: 16 }}>
                  <div className="divider" />
                  <button className="btn btn-primary btn-block" disabled={!!busy || !isConnected} onClick={onReview}>Request the panel's review (AI)</button>
                  <p className="hint" style={{ marginTop: 8 }}>Validators independently judge the current version's merit.</p>
                </div>
              )}
              {canResubmit && (
                <div style={{ marginTop: 16 }}>
                  <div className="divider" />
                  <h3 style={{ fontSize: 17 }}>Submit a revision (round {cur.round + 1})</h3>
                  <div className="field"><label>Revised abstract</label>
                    <textarea value={rAbstract} onChange={(e) => setRAbstract(e.target.value)} placeholder="Address the reviewers' required changes." /></div>
                  <div className="field mono-in"><label>Manuscript URL <span className="faint">(optional)</span></label>
                    <input value={rUrl} onChange={(e) => setRUrl(e.target.value)} placeholder="https://…" /></div>
                  <div className="field"><label>Response to reviewers <span className="faint">(optional)</span></label>
                    <textarea value={rNote} onChange={(e) => setRNote(e.target.value)} placeholder="What you changed." style={{ minHeight: 56 }} /></div>
                  <button className="btn btn-primary btn-block" disabled={!!busy || rAbstract.trim().length < 16} onClick={onResubmit}>Resubmit →</button>
                </div>
              )}
              {cur.status === "REVISE" && !isAuthor && <div className="banner info" style={{ marginTop: 14 }}>Awaiting the author's revision.</div>}
              {cur.status === "REJECTED" && <div className="banner warn" style={{ marginTop: 14 }}>This submission was rejected after review.</div>}

              {/* credential */}
              {cred?.issued && (
                <div className="cred">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><h3>Credential issued</h3></div>
                  <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>A verifiable on-chain attestation that this work passed peer review.</p>
                  <div className="cmeta">author {short(cred.author)} · merit {cred.merit} · {cred.rounds} round(s) · seq #{cred.issuedSeq}</div>
                </div>
              )}
            </div>
          ) : <div className="panel"><div className="empty">{busy ? "Loading…" : "Load a submission or submit a manuscript."}</div></div>}

          {/* version chain */}
          {cur && versions.length > 0 && (
            <div className="panel">
              <h3>Version history</h3>
              <div className="divider" />
              <div className="chain">
                {versions.map((v) => (
                  <div className="vrow" key={v.seq}>
                    <div className="vhead"><span className="vr">v{v.round}</span></div>
                    <div className="vab">{v.abstract}</div>
                    {v.note && <div className="vnote">↳ response: {v.note}</div>}
                    {v.contentUrl && <a className="vr" href={v.contentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--blue-br)" }}>manuscript ↗</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* decisions history */}
          {cur && decisions.length > 0 && (
            <div className="panel">
              <h3>Review history</h3>
              <div className="divider" />
              {decisions.map((d) => (
                <div className="dcard" key={d.seq}>
                  <div className="dhead">
                    <span className="vr mono" style={{ color: "var(--blue-br)" }}>Round {d.round}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><DecisionPill d={d.decision} /><span className="chip">merit <b>{d.merit}</b></span></div>
                  </div>
                  <div className="dsum">“{d.summary}”</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {busy && <div className="toast"><span className="spin" />{busy}</div>}
    </div>
  );
}
