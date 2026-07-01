import { useState } from "react";
import { Landing } from "./Landing";
import { App } from "./App";

export function Shell() {
  const [page, setPage] = useState<"landing" | "app">("landing");
  const go = (p: "landing" | "app") => { setPage(p); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); };
  return page === "landing" ? <Landing onLaunch={() => go("app")} /> : <App onBack={() => go("landing")} />;
}
