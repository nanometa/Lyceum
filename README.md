# Lyceum

Decentralized scientific peer review as a transparent, on-chain editorial loop, built on GenLayer
(Testnet Bradbury).

An author submits a manuscript. A panel of GenLayer validators judges each version's merit. The
author revises and resubmits until the work is accepted, and walks away with a verifiable on-chain
credential instead of an opaque verdict.

> Different by design. The merit scores are inputs to a decision, never the product. The product is
> a versioned document plus a revise-and-resubmit convergence loop that ends in a terminal decision
> and a credential.

## How the mechanic works

- A manuscript is a chain of versions. Each review round, the panel judges the current version and
  returns an overall merit from 0 to 100, which maps to a decision band: ACCEPT (merit 80 and up),
  MINOR (65 to 79), MAJOR (45 to 64), REJECT (below 45).
- ACCEPT is terminal and issues a credential. REJECT is terminal. MINOR and MAJOR send the work back
  to REVISE: the author submits a new version and the loop repeats, up to three rounds. At the final
  round the process is forced to converge, so nothing loops forever.
- Judging is a single LLM pass under consensus: validators independently re-judge and only agree
  when their merit lands within a set tolerance. Manuscripts are handled as text and an optional
  content URL the panel fetches; PDFs stay off-chain.
- The credential is a verifiable on-chain attestation (a registry record, not a token): author,
  title, final merit and round count.

## Deployed contract (Bradbury)

```
PeerReview  0x60548026CdF9C9451c275Ad92eD7dF1a6e95AF8F
chain 4221 · https://rpc-bradbury.genlayer.com
```

## Contract ABI

Writes
- `submit_manuscript(title, field, abstract, content_url)` returns the new id. The author submits
  version 1.
- `review_round(submission_id)` returns a dict. The panel judges the current version.
- `resubmit(submission_id, abstract, content_url, response_note)`. The author revises after a MINOR
  or MAJOR decision.

Views
- `get_submission(id)`, `get_versions(id)`, `get_decisions(id)`, `get_credential(id)`,
  `list_by_author(who)`, `list_recent(limit)`, `review_stats()`.

## Design

A technical brutalist interface: flat dark surfaces, sharp corners, 1px solid borders, no glows or
gradients, and a strict grid. The console reads like a data terminal, with a merit gauge, a version
timeline, per-round review cards and a credential block. Type is Inter for text and JetBrains Mono
for data and labels.

## Notes

- Testnet only (Bradbury). Credentials are attestations, not transferable tokens.
- LLM consensus transactions can take a few minutes on a busy testnet. Reads use the latest
  non-final state and retry through transient read-lag.
