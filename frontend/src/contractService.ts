import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus, TransactionHashVariant } from "genlayer-js/types";
import { CONTRACT_ADDRESS, GENLAYER_NETWORK } from "./chain";

type Hex = `0x${string}`;
const TIMEOUT_MS = 600_000;
const NONFINAL = TransactionHashVariant.LATEST_NONFINAL;

export type SubStatus = "UNDER_REVIEW" | "REVISE" | "ACCEPTED" | "REJECTED" | "";
export type Decision = "ACCEPT" | "MINOR" | "MAJOR" | "REJECT" | "";

export interface SubmissionCard {
  id: number; author: string; title: string; field: string; status: SubStatus;
  round: number; lastDecision: Decision; lastMerit: number; terminal: boolean; accepted: boolean;
}
export interface SubmissionFull extends SubmissionCard {
  versionCount: number; maxRounds: number; hasCredential: boolean; openedSeq: number; lastSeq: number;
}
export interface Version { round: number; contentUrl: string; abstract: string; note: string; seq: number; }
export interface RoundDecision { round: number; decision: Decision; merit: number; quality: number; novelty: number; rigor: number; summary: string; seq: number; }
export interface Credential { issued: boolean; submissionId: number; author: string; title: string; merit: number; rounds: number; issuedSeq: number; }
export interface Stats { nextId: number; totalSubmissions: number; totalAccepted: number; totalRejected: number; totalRounds: number; maxRounds: number; acceptMin: number; minorMin: number; majorMin: number; }

function readClient() { return createClient({ chain: testnetBradbury, account: createAccount() }); }
async function writeClient(account: Hex) {
  const c = createClient({ chain: testnetBradbury, account });
  await c.connect(GENLAYER_NETWORK);
  return c;
}
async function waitAccepted(client: any, hash: Hex) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Transaction timed out")), TIMEOUT_MS); });
  try {
    await Promise.race([
      client.waitForTransactionReceipt({ hash: hash as never, status: TransactionStatus.ACCEPTED, interval: 5000, retries: 180 }),
      timeout,
    ]);
  } finally { if (timer) clearTimeout(timer); }
}

function g(o: any, k: string, idx: number): any {
  if (o == null) return undefined;
  if (o instanceof Map) return o.has(k) ? o.get(k) : undefined;
  if (Array.isArray(o)) return o[idx];
  if (typeof o === "object" && k in o) return o[k];
  return undefined;
}
const asStr = (v: any, d = "") => (v == null ? d : String(v));
const asNum = (v: any, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const asBool = (v: any) => v === true || v === "true" || v === 1 || v === 1n || v === "1";

function mapCard(x: any): SubmissionCard {
  return {
    id: asNum(g(x, "submission_id", 0)),
    author: asStr(g(x, "author", 1)),
    title: asStr(g(x, "title", 2)),
    field: asStr(g(x, "field", 3)),
    status: asStr(g(x, "status", 4)) as SubStatus,
    round: asNum(g(x, "round", 5)),
    lastDecision: asStr(g(x, "last_decision", 6)) as Decision,
    lastMerit: asNum(g(x, "last_merit", 7)),
    terminal: asBool(g(x, "terminal", 8)),
    accepted: asBool(g(x, "accepted", 9)),
  };
}

// ---- writes ----
export async function submitManuscript(account: Hex, title: string, field: string, abstract: string, contentUrl: string): Promise<number> {
  const wc = await writeClient(account);
  const h = (await wc.writeContract({ address: CONTRACT_ADDRESS as Hex, functionName: "submit_manuscript", args: [title, field, abstract, contentUrl.trim()], value: 0n })) as Hex;
  await waitAccepted(wc, h);
  const s = await reviewStats();
  return s.nextId - 1;
}
export async function reviewRound(account: Hex, sid: number): Promise<void> {
  const wc = await writeClient(account);
  const h = (await wc.writeContract({ address: CONTRACT_ADDRESS as Hex, functionName: "review_round", args: [sid], value: 0n })) as Hex;
  await waitAccepted(wc, h);
}
export async function resubmit(account: Hex, sid: number, abstract: string, contentUrl: string, note: string): Promise<void> {
  const wc = await writeClient(account);
  const h = (await wc.writeContract({ address: CONTRACT_ADDRESS as Hex, functionName: "resubmit", args: [sid, abstract, contentUrl.trim(), note], value: 0n })) as Hex;
  await waitAccepted(wc, h);
}

// ---- reads ----
export async function getSubmission(sid: number): Promise<SubmissionFull | null> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "get_submission", args: [sid], transactionHashVariant: NONFINAL });
    const c = mapCard(r);
    return {
      ...c,
      versionCount: asNum(g(r, "version_count", 10)),
      maxRounds: asNum(g(r, "max_rounds", 11), 3),
      hasCredential: asBool(g(r, "has_credential", 12)),
      openedSeq: asNum(g(r, "opened_seq", 13)),
      lastSeq: asNum(g(r, "last_seq", 14)),
    };
  } catch { return null; }
}
export async function getVersions(sid: number): Promise<Version[]> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "get_versions", args: [sid], transactionHashVariant: NONFINAL });
    if (!Array.isArray(r)) return [];
    return r.map((v: any) => ({
      round: asNum(g(v, "round", 0)), contentUrl: asStr(g(v, "content_url", 1)),
      abstract: asStr(g(v, "abstract", 2)), note: asStr(g(v, "note", 3)), seq: asNum(g(v, "seq", 4)),
    }));
  } catch { return []; }
}
export async function getDecisions(sid: number): Promise<RoundDecision[]> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "get_decisions", args: [sid], transactionHashVariant: NONFINAL });
    if (!Array.isArray(r)) return [];
    return r.map((d: any) => ({
      round: asNum(g(d, "round", 0)), decision: asStr(g(d, "decision", 1)) as Decision, merit: asNum(g(d, "merit", 2)),
      quality: asNum(g(d, "quality", 3)), novelty: asNum(g(d, "novelty", 4)), rigor: asNum(g(d, "rigor", 5)),
      summary: asStr(g(d, "summary", 6)), seq: asNum(g(d, "seq", 7)),
    }));
  } catch { return []; }
}
export async function getCredential(sid: number): Promise<Credential | null> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "get_credential", args: [sid], transactionHashVariant: NONFINAL });
    if (!asBool(g(r, "issued", 0))) return { issued: false, submissionId: sid, author: "", title: "", merit: 0, rounds: 0, issuedSeq: 0 };
    return {
      issued: true, submissionId: asNum(g(r, "submission_id", 1), sid), author: asStr(g(r, "author", 2)),
      title: asStr(g(r, "title", 3)), merit: asNum(g(r, "merit", 4)), rounds: asNum(g(r, "rounds", 5)), issuedSeq: asNum(g(r, "issued_seq", 6)),
    };
  } catch { return null; }
}
export async function listByAuthor(who: string): Promise<SubmissionCard[]> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "list_by_author", args: [who.trim()], transactionHashVariant: NONFINAL });
    return Array.isArray(r) ? r.map(mapCard) : [];
  } catch { return []; }
}
export async function listRecent(limit = 50): Promise<SubmissionCard[]> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "list_recent", args: [limit], transactionHashVariant: NONFINAL });
    return Array.isArray(r) ? r.map(mapCard) : [];
  } catch { return []; }
}
export async function reviewStats(): Promise<Stats> {
  try {
    const r: any = await readClient().readContract({ address: CONTRACT_ADDRESS as Hex, functionName: "review_stats", args: [], transactionHashVariant: NONFINAL });
    return {
      nextId: asNum(g(r, "next_id", 0)), totalSubmissions: asNum(g(r, "total_submissions", 1)),
      totalAccepted: asNum(g(r, "total_accepted", 2)), totalRejected: asNum(g(r, "total_rejected", 3)),
      totalRounds: asNum(g(r, "total_rounds", 4)), maxRounds: asNum(g(r, "max_rounds", 5), 3),
      acceptMin: asNum(g(r, "accept_min", 6), 80), minorMin: asNum(g(r, "minor_min", 7), 65), majorMin: asNum(g(r, "major_min", 8), 45),
    };
  } catch {
    return { nextId: 0, totalSubmissions: 0, totalAccepted: 0, totalRejected: 0, totalRounds: 0, maxRounds: 3, acceptMin: 80, minorMin: 65, majorMin: 45 };
  }
}
