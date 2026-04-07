import { useEffect, useMemo, useRef, useState } from "react";

const NODES = [
  { id: "gateway", label: "GATEWAY", sub: "Internet Entry", x: 310, y: 52, crit: false },
  { id: "firewall", label: "FIREWALL", sub: "Perimeter Defense", x: 310, y: 150, crit: false },
  { id: "web", label: "WEB", sub: "Public Facing", x: 148, y: 258, crit: false },
  { id: "dns", label: "DNS", sub: "Name Resolution", x: 472, y: 258, crit: false },
  { id: "app", label: "APP", sub: "Business Logic", x: 148, y: 366, crit: false },
  { id: "mail", label: "MAIL", sub: "Communications", x: 472, y: 366, crit: false },
  { id: "db", label: "DATABASE", sub: "Critical", x: 80, y: 470, crit: true },
  { id: "admin", label: "ADMIN", sub: "Critical", x: 310, y: 470, crit: true },
  { id: "backup", label: "BACKUP", sub: "Recovery", x: 536, y: 470, crit: false },
];

const EDGES = [
  ["gateway", "firewall"],
  ["firewall", "web"],
  ["firewall", "dns"],
  ["web", "app"],
  ["app", "db"],
  ["app", "admin"],
  ["admin", "backup"],
  ["dns", "mail"],
];

const MAX_TURNS = 10;
const ATTACK_METHODS = ["EXPLOIT", "PHISHING", "BRUTEFORCE", "LATERAL_MOVE", "ZERO_DAY"];
const DEFENSE_ACTIONS = ["PATCH", "HARDEN", "ISOLATE", "MONITOR", "RESTORE"];

const COLORS = {
  secure: { fill: "#051a0d", stroke: "#00e676", text: "#00e676" },
  vulnerable: { fill: "#1a1000", stroke: "#ffb300", text: "#ffb300" },
  compromised: { fill: "#1a0505", stroke: "#ff1744", text: "#ff1744" },
};

const ATTACK_COPY = {
  EXPLOIT: "Exploit exposed services and weak configs.",
  PHISHING: "Use social engineering and stolen credentials.",
  BRUTEFORCE: "Hammer access controls and privilege boundaries.",
  LATERAL_MOVE: "Pivot from an exposed foothold deeper inside.",
  ZERO_DAY: "Burn a premium capability to bypass standard controls.",
};

const DEFENSE_COPY = {
  PATCH: "Reset the chosen node back to secure.",
  HARDEN: "Fortify the chosen node before or after contact.",
  ISOLATE: "Block the attack only if you defend the attacked node.",
  MONITOR: "Detect and block phishing only when aimed at MAIL.",
  RESTORE: "Recover a compromised or vulnerable node to secure.",
};

/* ─── QUESTION BANK ─── */
const QUIZ_BANK = {
  EXPLOIT: {
    question: "What does the Exploit move do?",
    answers: [
      { text: "Forces the defender to skip their next turn", correct: false },
      { text: "Targets a known vulnerability in a specific node to damage it", correct: true },
      { text: "Spreads damage across all nodes connected to the target", correct: false },
    ],
  },
  PHISHING: {
    question: "Which type of node is Phishing most effective against?",
    answers: [
      { text: "Database servers protected by weak encryption", correct: false },
      { text: "Firewalls with misconfigured rules", correct: false },
      { text: "Human-operated nodes like Admins and Mail", correct: true },
    ],
  },
  BRUTEFORCE: {
    question: "What makes Brute Force easy for the defender to detect?",
    answers: [
      { text: "It leaves a permanent damage marker on the attacked node", correct: false },
      { text: "It generates repeated login attempts that Monitor can catch", correct: true },
      { text: "The attacker must declare the target out loud before using it", correct: false },
    ],
  },
  LATERAL_MOVE: {
    question: "What condition must be true before the attacker can use Lateral Move?",
    answers: [
      { text: "The defender must have already used Isolate that round", correct: false },
      { text: "The attacker must already control an adjacent compromised node", correct: true },
      { text: "The attacker must have used Zero Day on their previous turn", correct: false },
    ],
  },
  ZERO_DAY: {
    question: "Why can most defenses not stop a Zero Day attack?",
    answers: [
      { text: "Zero Day automatically targets the highest-value node on the board", correct: false },
      { text: "It exploits an unknown vulnerability that Patch and Harden can't anticipate", correct: true },
      { text: "It forces the defender to discard all cards in their hand", correct: false },
    ],
  },
  PATCH: {
    question: "Which attack does Patch most directly counter?",
    answers: [
      { text: "Phishing, by training users to recognize suspicious messages", correct: false },
      { text: "Exploit, by closing the known vulnerability being targeted", correct: true },
      { text: "Lateral Move, by sealing connections between nodes", correct: false },
    ],
  },
  HARDEN: {
    question: "How is Harden different from Patch?",
    answers: [
      { text: "Harden can only be applied to the Gateway and Firewall nodes", correct: false },
      { text: "Harden tightens configuration and raises attack difficulty without fully blocking attacks", correct: true },
      { text: "Harden permanently disables the node to make it an invalid target", correct: false },
    ],
  },
  ISOLATE: {
    question: "What is the main reason to Isolate a node?",
    answers: [
      { text: "To restore it to a clean state after it's been compromised", correct: false },
      { text: "To cut it off from the network and prevent Lateral Move from passing through it", correct: true },
      { text: "To scan neighboring nodes for incoming threats", correct: false },
    ],
  },
  MONITOR: {
    question: "What does Monitor do when it detects an attack?",
    answers: [
      { text: "Automatically blocks the attack and prevents all damage", correct: false },
      { text: "Alerts the defender so they can respond — but doesn't prevent damage on its own", correct: true },
      { text: "Deals damage back to the attacker equal to the attack's strength", correct: false },
    ],
  },
  RESTORE: {
    question: "What happens if the attacker compromises the Backup node before the defender uses Restore?",
    answers: [
      { text: "Nothing — Restore always succeeds regardless of the Backup's status", correct: false },
      { text: "The defender permanently loses access to the Restore move", correct: false },
      { text: "Restores either fail or produce a corrupted result, weakening the defender's recovery", correct: true },
    ],
  },
};

/* ─── DEBRIEF COPY ─── */
const DEBRIEF_DATA = {
  EXPLOIT: {
    atkDesc: "Exploit targets known software vulnerabilities or misconfigurations. In real-world attacks, this is one of the most common initial access techniques — attackers scan for unpatched services and use publicly known exploits to gain a foothold.",
    counter: "Patch is the primary counter. Keeping systems up to date closes the exact vulnerabilities Exploit relies on. Harden also helps by reducing the attack surface through tighter configurations.",
  },
  PHISHING: {
    atkDesc: "Phishing is a social engineering attack that targets people, not systems. Even networks with perfect patch management are vulnerable because phishing tricks users into handing over credentials or clicking malicious links.",
    counter: "Monitor is the key defense — security awareness training and email filtering catch phishing attempts before they succeed. Isolate can limit the blast radius if phishing does compromise a node.",
  },
  BRUTEFORCE: {
    atkDesc: "Brute Force works by hammering login endpoints with repeated credential guesses. It is noisy and slow compared to other techniques, but it reliably works against systems with weak passwords or no account lockout policies.",
    counter: "Monitor detects the flood of failed login attempts. Harden raises the bar with stronger authentication requirements like MFA, rate limiting, and complex password policies.",
  },
  LATERAL_MOVE: {
    atkDesc: "Lateral Movement is how attackers expand from a single compromised machine deeper into the network. Techniques include pass-the-hash, RDP hopping, and abusing trust relationships between systems.",
    counter: "Isolate is the strongest counter — network segmentation physically prevents the attacker from pivoting through a node. Without isolation, a single compromised host can become a launching pad for the entire network.",
  },
  ZERO_DAY: {
    atkDesc: "A Zero Day exploits an unknown vulnerability that has no existing patch. These are the most dangerous attacks because standard defenses like patching and hardening cannot anticipate them. In practice, zero-days are rare and expensive.",
    counter: "No single defense reliably stops a zero-day. Defense-in-depth is key — layering Monitor for detection, Isolate to limit spread, and Restore for rapid recovery after the inevitable breach.",
  },
};

const DEFENSE_DEBRIEF = {
  PATCH: "Patch represents applying software updates and fixing known vulnerabilities. It's the most fundamental defensive action — the majority of successful cyberattacks exploit vulnerabilities that already have patches available.",
  HARDEN: "Hardening goes beyond patching by removing unnecessary services, tightening access controls, and enforcing least-privilege. It reduces the overall attack surface even against threats that patches don't cover.",
  ISOLATE: "Isolation (network segmentation) is one of the most powerful defensive tools. By cutting network paths, you contain breaches to a small segment instead of losing the entire network.",
  MONITOR: "Monitoring provides visibility — you can't defend what you can't see. SIEM systems, intrusion detection, and log analysis help defenders spot attacks in progress and respond before damage spreads.",
  RESTORE: "Restore represents incident recovery — rebuilding from clean backups after a compromise. It's essential for resilience, but only works if backups themselves are secure and untampered.",
};

/* ─── SHUFFLE UTILITY ─── */
function shuffleArray(arr) {
  const shuffled = arr.map((item, originalIndex) => ({ ...item, originalIndex }));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function initNodes() {
  return NODES.map((n) => ({ ...n, status: "secure" }));
}

function getReachable(nodes) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const exposed = new Set(nodes.filter((n) => n.status !== "secure").map((n) => n.id));
  const reachable = new Set(["gateway", "firewall"]);

  for (const [a, b] of EDGES) {
    if (exposed.has(a)) reachable.add(b);
    if (exposed.has(b)) reachable.add(a);
  }

  return [...reachable].filter((id) => byId[id] && byId[id].status !== "compromised");
}

function canAttackTarget(nodes, targetId, method) {
  const target = nodes.find((n) => n.id === targetId);
  if (!target || target.status === "compromised") return false;
  if (method === "PHISHING") return targetId === "mail" || targetId === "admin";
  if (method === "BRUTEFORCE") return ["firewall", "admin", "backup"].includes(targetId);
  if (method === "LATERAL_MOVE") return target.status !== "secure" || ["app", "db", "admin"].includes(targetId);
  if (method === "ZERO_DAY") return ["firewall", "dns", "app"].includes(targetId);
  return true;
}

function getAttackOptions(nodes) {
  const reachable = getReachable(nodes);
  const options = [];

  for (const nodeId of reachable) {
    for (const method of ATTACK_METHODS) {
      if (canAttackTarget(nodes, nodeId, method)) {
        options.push({ target: nodeId, method });
      }
    }
  }

  return options;
}

function getAttackNarrative(nodeLabel, method) {
  return {
    EXPLOIT: `Red launches a direct exploit chain against ${nodeLabel}.`,
    PHISHING: `Red uses deception and credential theft to pressure ${nodeLabel}.`,
    BRUTEFORCE: `Red concentrates repeated access attempts against ${nodeLabel}.`,
    LATERAL_MOVE: `Red pivots from an existing foothold toward ${nodeLabel}.`,
    ZERO_DAY: `Red burns a simulated zero-day to crack ${nodeLabel}.`,
  }[method];
}

function getDefenseNarrative(nodeLabel, action) {
  return {
    PATCH: `Blue patches and re-baselines ${nodeLabel}.`,
    HARDEN: `Blue hardens ${nodeLabel} with tighter controls and segmentation.`,
    ISOLATE: `Blue isolates ${nodeLabel} to stop east-west movement.`,
    MONITOR: `Blue floods ${nodeLabel} with detection and alerting coverage.`,
    RESTORE: `Blue restores ${nodeLabel} from a known-good state.`,
  }[action];
}

function findEdgeForTarget(nodes, targetId) {
  const exposed = new Set(nodes.filter((n) => n.status !== "secure").map((n) => n.id));
  return (
    EDGES.find(([a, b]) => b === targetId && (a === "gateway" || exposed.has(a))) ||
    EDGES.find(([a, b]) => a === targetId && (b === "gateway" || exposed.has(b))) ||
    EDGES.find(([a, b]) => a === targetId || b === targetId)
  );
}

function applyTurn(nodes, attack, defense) {
  const next = nodes.map((n) => ({ ...n }));
  const atkNode = next.find((n) => n.id === attack.target);
  const defNode = next.find((n) => n.id === defense.target);

  let blocked = false;
  let attackerPoint = 0;
  let defenderPoint = 0;
  const atkEvents = [];
  const defEvents = [];

  if (defense.action === "ISOLATE" && defense.target === attack.target) {
    blocked = true;
    defenderPoint += 1;
    defEvents.push(`BLOCKED: ${atkNode.label} was isolated in time.`);
  }

  if (!blocked && defense.action === "MONITOR" && attack.method === "PHISHING" && defense.target === attack.target) {
    blocked = true;
    defenderPoint += 1;
    defEvents.push(`DETECTED: phishing against ${atkNode.label} was caught and contained.`);
  }

  if (!blocked) {
    if (atkNode.status === "secure") {
      atkNode.status = "vulnerable";
      atkEvents.push(`DEGRADED: ${atkNode.label} is now VULNERABLE`);
    } else if (atkNode.status === "vulnerable") {
      atkNode.status = "compromised";
      attackerPoint += 1;
      atkEvents.push(`COMPROMISED: ${atkNode.label}`);
    }
  }

  if (defense.action === "PATCH" || defense.action === "RESTORE") {
    if (defNode.status !== "secure") {
      defNode.status = "secure";
      defEvents.push(`RESTORED: ${defNode.label}`);
    } else {
      defEvents.push(`${defNode.label} was already secure.`);
    }
  }

  if (defense.action === "HARDEN") {
    if (defNode.status === "secure") {
      defEvents.push(`HARDENED: ${defNode.label} remains difficult to breach.`);
    } else {
      defNode.status = "secure";
      defEvents.push(`HARDENED: ${defNode.label} pushed back to SECURE.`);
    }
  }

  const critDown = next.filter((n) => n.crit && n.status === "compromised").length;

  return {
    nodes: next,
    attackerPoint,
    defenderPoint,
    blocked,
    atkEvents,
    defEvents,
    critDown,
  };
}

/* ─── QUIZ MODAL COMPONENT ─── */
function QuizModal({ actionKey, team, onPass, onCancel }) {
  const quiz = QUIZ_BANK[actionKey];
  const [shuffledAnswers] = useState(() => shuffleArray(quiz?.answers || []));
  const [eliminated, setEliminated] = useState(new Set());
  const [correct, setCorrect] = useState(false);
  const [shakeIdx, setShakeIdx] = useState(null);

  if (!quiz) return null;

  const borderColor = team === "red" ? "#ff1744" : "#00e676";
  const bgColor = team === "red" ? "#1a0b10" : "#091b12";
  const accentColor = team === "red" ? "#ff5252" : "#69f0ae";
  const teamLabel = team === "red" ? "RED TEAM" : "BLUE TEAM";

  const handleAnswer = (idx) => {
    if (correct || eliminated.has(idx)) return;
    if (shuffledAnswers[idx].correct) {
      setCorrect(true);
    } else {
      setEliminated((prev) => new Set([...prev, idx]));
      setShakeIdx(idx);
      setTimeout(() => setShakeIdx(null), 500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2, 6, 10, 0.85)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "460px", background: "#080e14", border: `1px solid ${borderColor}40`, borderRadius: "6px", overflow: "hidden", boxShadow: `0 0 40px ${borderColor}15` }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", background: bgColor, borderBottom: `1px solid ${borderColor}30`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "9px", color: borderColor, letterSpacing: "2px", opacity: 0.7 }}>{teamLabel} KNOWLEDGE CHECK</span>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "13px", color: "#fff", marginTop: "4px", letterSpacing: "1px" }}>{actionKey.replace("_", " ")}</div>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: `2px solid ${borderColor}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: correct ? "#00e676" : borderColor }}>
            {correct ? "\u2713" : "?"}
          </div>
        </div>

        {/* Question */}
        <div style={{ padding: "18px" }}>
          <div style={{ fontSize: "12px", color: "#c0d8e8", marginBottom: "16px", lineHeight: "1.6" }}>{quiz.question}</div>

          {/* Answer choices — shuffled order */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {shuffledAnswers.map((ans, idx) => {
              const isEliminated = eliminated.has(idx);
              const isCorrectAnswer = ans.correct && correct;
              const isShaking = shakeIdx === idx;

              let answerBg = "#0a1620";
              let answerBorder = "#1a3a50";
              let answerColor = "#8ab4c8";
              let cursor = "pointer";

              if (isEliminated) {
                answerBg = "#0a0a0a";
                answerBorder = "#1a1a1a";
                answerColor = "#333";
                cursor = "not-allowed";
              } else if (isCorrectAnswer) {
                answerBg = "#0a1a10";
                answerBorder = "#00e676";
                answerColor = "#00e676";
                cursor = "default";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isEliminated || correct}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    background: answerBg,
                    border: `1px solid ${answerBorder}`,
                    borderRadius: "4px",
                    color: answerColor,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: "11px",
                    lineHeight: "1.5",
                    cursor,
                    transition: "all 0.2s",
                    position: "relative",
                    animation: isShaking ? "quizShake 0.4s ease-out" : undefined,
                  }}
                >
                  <span style={{ color: isEliminated ? "#222" : isCorrectAnswer ? "#00e676" : "#4a7a90", marginRight: "8px", fontWeight: "bold" }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {ans.text}
                  {isEliminated && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "#ff1744", letterSpacing: "1px" }}>INCORRECT</span>
                  )}
                  {isCorrectAnswer && (
                    <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "#00e676", letterSpacing: "1px" }}>CORRECT</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Wrong answer feedback */}
          {eliminated.size > 0 && !correct && (
            <div style={{ marginTop: "12px", fontSize: "10px", color: "#ff5252", textAlign: "center", letterSpacing: "1px" }}>
              Wrong answer — try again.
            </div>
          )}

          {/* Correct answer feedback */}
          {correct && (
            <div style={{ marginTop: "14px", padding: "12px", background: "#071510", border: "1px solid #00e67630", borderRadius: "4px" }}>
              <div style={{ fontSize: "10px", color: "#00e676", letterSpacing: "1px", marginBottom: "6px" }}>CORRECT — KNOWLEDGE VERIFIED</div>
              <div style={{ fontSize: "10px", color: "#69f0ae", lineHeight: "1.6" }}>
                You understand what {actionKey.replace("_", " ")} does. Proceed with your move.
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "0 18px 16px", display: "flex", gap: "8px" }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "10px", background: "#07111a", border: "1px solid #0c2e45", color: "#2a5a70", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", borderRadius: "3px" }}
          >
            CANCEL
          </button>
          <button
            onClick={onPass}
            disabled={!correct}
            style={{
              flex: 2,
              padding: "10px",
              background: correct ? bgColor : "#07111a",
              border: `1px solid ${correct ? borderColor : "#0c2e45"}`,
              color: correct ? accentColor : "#2a3a45",
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              letterSpacing: "1px",
              cursor: correct ? "pointer" : "not-allowed",
              borderRadius: "3px",
              fontWeight: "bold",
            }}
          >
            {correct ? "CONFIRM MOVE" : "ANSWER CORRECTLY TO PROCEED"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DEBRIEF PANEL COMPONENT ─── */
function DebriefPanel({ attackMethod, defenseAction, resolution, attackTarget, defenseTarget, onDismiss }) {
  const atkInfo = DEBRIEF_DATA[attackMethod] || {};
  const defInfo = DEFENSE_DEBRIEF[defenseAction] || "";
  const atkLabel = NODES.find((n) => n.id === attackTarget)?.label || attackTarget;
  const defLabel = NODES.find((n) => n.id === defenseTarget)?.label || defenseTarget;

  let outcomeColor = "#ffb300";
  let outcomeText = "ATTACK DEGRADED TARGET";
  let outcomeIcon = "\u26A0";
  if (resolution.blocked) {
    outcomeColor = "#00e676";
    outcomeText = "ATTACK BLOCKED BY DEFENSE";
    outcomeIcon = "\u2713";
  } else if (resolution.attackerPoint > 0) {
    outcomeColor = "#ff1744";
    outcomeText = "NODE FULLY COMPROMISED";
    outcomeIcon = "\u2716";
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2, 6, 10, 0.85)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "540px", maxHeight: "80vh", background: "#080e14", border: "1px solid #1a3a50", borderRadius: "6px", overflow: "hidden", boxShadow: "0 0 40px rgba(0,180,255,0.08)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", background: "#04111a", borderBottom: "1px solid #0c2e45", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "9px", color: "#00d4ff", letterSpacing: "2px" }}>TURN DEBRIEF</span>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "12px", color: "#fff", marginTop: "4px", letterSpacing: "1px" }}>INTELLIGENCE REPORT</div>
          </div>
          <div style={{ padding: "4px 12px", border: `1px solid ${outcomeColor}`, borderRadius: "3px", color: outcomeColor, fontSize: "10px", letterSpacing: "1px" }}>
            {outcomeIcon} {outcomeText}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: "18px", overflowY: "auto", flex: 1 }}>
          {/* Outcome summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ padding: "10px", background: "#1a0b10", border: "1px solid #3a151f", borderRadius: "4px" }}>
              <div style={{ fontSize: "9px", color: "#ff5252", letterSpacing: "1px", marginBottom: "4px" }}>RED TEAM USED</div>
              <div style={{ fontSize: "12px", color: "#ff7070", fontWeight: "bold" }}>{attackMethod.replace("_", " ")}</div>
              <div style={{ fontSize: "10px", color: "#804040", marginTop: "2px" }}>Target: {atkLabel}</div>
            </div>
            <div style={{ padding: "10px", background: "#091b12", border: "1px solid #163424", borderRadius: "4px" }}>
              <div style={{ fontSize: "9px", color: "#00e676", letterSpacing: "1px", marginBottom: "4px" }}>BLUE TEAM USED</div>
              <div style={{ fontSize: "12px", color: "#69f0ae", fontWeight: "bold" }}>{defenseAction}</div>
              <div style={{ fontSize: "10px", color: "#406040", marginTop: "2px" }}>Target: {defLabel}</div>
            </div>
          </div>

          {/* Event log */}
          {(resolution.atkEvents.length > 0 || resolution.defEvents.length > 0) && (
            <div style={{ marginBottom: "16px", padding: "10px", background: "#060c12", border: "1px solid #0c2e4540", borderRadius: "4px" }}>
              <div style={{ fontSize: "9px", color: "#4a7a90", letterSpacing: "1px", marginBottom: "6px" }}>EVENTS THIS TURN</div>
              {resolution.atkEvents.map((e, i) => (
                <div key={`a${i}`} style={{ fontSize: "10px", color: "#ff7070", lineHeight: "1.6", padding: "2px 0" }}>{e}</div>
              ))}
              {resolution.defEvents.map((e, i) => (
                <div key={`d${i}`} style={{ fontSize: "10px", color: "#69f0ae", lineHeight: "1.6", padding: "2px 0" }}>{e}</div>
              ))}
            </div>
          )}

          {/* Educational content — Attack */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", color: "#ff5252", letterSpacing: "1px", marginBottom: "6px", borderBottom: "1px solid #ff174420", paddingBottom: "4px" }}>ABOUT: {attackMethod.replace("_", " ")}</div>
            <div style={{ fontSize: "11px", color: "#c0a0a0", lineHeight: "1.7" }}>{atkInfo.atkDesc}</div>
          </div>

          {/* Educational content — Defense */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", color: "#00e676", letterSpacing: "1px", marginBottom: "6px", borderBottom: "1px solid #00e67620", paddingBottom: "4px" }}>ABOUT: {defenseAction}</div>
            <div style={{ fontSize: "11px", color: "#a0c0a0", lineHeight: "1.7" }}>{defInfo}</div>
          </div>

          {/* Matchup insight */}
          <div style={{ padding: "10px 12px", background: "#0a141e", border: "1px solid #0c2e45", borderRadius: "4px" }}>
            <div style={{ fontSize: "10px", color: "#00d4ff", letterSpacing: "1px", marginBottom: "6px" }}>MATCHUP INSIGHT</div>
            <div style={{ fontSize: "11px", color: "#8ab4c8", lineHeight: "1.7" }}>{atkInfo.counter}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #0c2e45", background: "#04111a" }}>
          <button
            onClick={onDismiss}
            style={{ width: "100%", padding: "11px", background: "#081820", border: "1px solid #00d4ff40", color: "#00d4ff", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", letterSpacing: "2px", cursor: "pointer", borderRadius: "3px" }}
          >
            CONTINUE TO NEXT TURN
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
  @keyframes atkPulse { 0% { r: 30; opacity: 0.9; } 100% { r: 62; opacity: 0; } }
  @keyframes defPulse { 0% { r: 30; opacity: 0.9; } 100% { r: 55; opacity: 0; } }
  @keyframes dashFlow { to { stroke-dashoffset: -24; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes winPulse { 0%,100% { box-shadow: 0 0 8px currentColor; } 50% { box-shadow: 0 0 24px currentColor; } }
  @keyframes quizShake { 0% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(2px); } 100% { transform: translateX(0); } }
  .pulse-atk { animation: atkPulse 0.75s ease-out infinite; }
  .pulse-def { animation: defPulse 0.6s ease-out infinite; }
  .pulse-blk { animation: defPulse 0.5s ease-out 2; }
  .dash-flow { animation: dashFlow 0.35s linear 3; }
  .log-line { animation: fadeIn 0.25s ease-out; }
  .win-banner { animation: winPulse 1.4s ease-in-out infinite; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: #08141e; }
  ::-webkit-scrollbar-thumb { background: #0e3050; border-radius: 2px; }
`;

/* ─── MAIN COMPONENT ─── */
export default function CyberWarGame() {
  const [nodes, setNodes] = useState(initNodes);
  const [turn, setTurn] = useState(1);
  const [step, setStep] = useState("attack");
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ atk: 0, def: 0 });
  const [atkLog, setAtkLog] = useState([]);
  const [defLog, setDefLog] = useState([]);
  const [pulse, setPulse] = useState(null);
  const [hotEdge, setHotEdge] = useState(null);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [attackMethod, setAttackMethod] = useState("EXPLOIT");
  const [attackTarget, setAttackTarget] = useState(null);
  const [defenseAction, setDefenseAction] = useState("PATCH");
  const [defenseTarget, setDefenseTarget] = useState(null);

  // Quiz modal state
  const [quizOpen, setQuizOpen] = useState(null);

  // Debrief panel state
  const [debriefData, setDebriefData] = useState(null);

  const atkRef = useRef(null);
  const defRef = useRef(null);

  useEffect(() => {
    if (atkRef.current) atkRef.current.scrollTop = 0;
    if (defRef.current) defRef.current.scrollTop = 0;
  }, [atkLog, defLog]);

  const attackSurface = Math.round((nodes.filter((n) => n.status !== "secure").length / nodes.length) * 100);
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const reachable = useMemo(() => getReachable(nodes), [nodes]);
  const attackOptions = useMemo(() => getAttackOptions(nodes), [nodes]);
  const validTargetsForMethod = useMemo(
    () => [...new Set(attackOptions.filter((o) => o.method === attackMethod).map((o) => o.target))],
    [attackOptions, attackMethod]
  );

  useEffect(() => {
    if (!validTargetsForMethod.includes(attackTarget)) {
      setAttackTarget(validTargetsForMethod[0] || null);
    }
  }, [validTargetsForMethod, attackTarget]);

  useEffect(() => {
    if (!defenseTarget) {
      setDefenseTarget(nodes[0]?.id || null);
    }
  }, [defenseTarget, nodes]);

  const aLog = (msg) => setAtkLog((l) => [{ id: Date.now() + Math.random(), msg }, ...l].slice(0, 50));
  const dLog = (msg) => setDefLog((l) => [{ id: Date.now() + Math.random(), msg }, ...l].slice(0, 50));

  /* ─── ATTACK: open quiz before locking ─── */
  const handleLockAttack = () => {
    if (!attackTarget || step !== "attack" || result) return;
    setQuizOpen({
      actionKey: attackMethod,
      team: "red",
      callback: () => {
        setQuizOpen(null);
        doPreviewAttack();
      },
    });
  };

  const doPreviewAttack = () => {
    if (!attackTarget) return;
    const node = NODES.find((n) => n.id === attackTarget);
    const edge = findEdgeForTarget(nodes, attackTarget);
    if (edge) setHotEdge({ from: edge[0], to: edge[1], type: "atk" });
    setPulse({ nodeId: attackTarget, type: "atk" });
    setSelectedAttack({ target: attackTarget, method: attackMethod });
    aLog(`\u2501\u2501\u2501\u2501 TURN ${turn}/${MAX_TURNS} \u2501\u2501\u2501\u2501`);
    aLog(`> TARGET: ${node?.label} via ${attackMethod}`);
    aLog(`> ${getAttackNarrative(node?.label || attackTarget, attackMethod)}`);
    setStep("defense");
  };

  /* ─── DEFENSE: open quiz before resolving ─── */
  const handleResolveTurn = () => {
    if (!selectedAttack || !defenseTarget || result || step !== "defense") return;
    setQuizOpen({
      actionKey: defenseAction,
      team: "blue",
      callback: () => {
        setQuizOpen(null);
        doResolveTurn();
      },
    });
  };

  const doResolveTurn = async () => {
    if (!selectedAttack || !defenseTarget || result) return;

    const defendNode = NODES.find((n) => n.id === defenseTarget);

    dLog(`\u2501\u2501\u2501\u2501 TURN ${turn}/${MAX_TURNS} \u2501\u2501\u2501\u2501`);
    dLog(`> RESPONSE: ${defendNode?.label} [${defenseAction}]`);
    dLog(`> ${getDefenseNarrative(defendNode?.label || defenseTarget, defenseAction)}`);

    const pulseType = defenseTarget === selectedAttack.target ? "blk" : "def";
    setPulse({ nodeId: defenseTarget, type: pulseType });
    await new Promise((r) => setTimeout(r, 500));

    const resolution = applyTurn(nodes, selectedAttack, { target: defenseTarget, action: defenseAction });

    resolution.atkEvents.forEach(aLog);
    resolution.defEvents.forEach(dLog);

    setNodes(resolution.nodes);
    setScore((s) => ({ atk: s.atk + resolution.attackerPoint, def: s.def + resolution.defenderPoint }));
    setPulse(null);
    setHotEdge(null);

    // Show debrief panel BEFORE advancing the turn
    setDebriefData({
      attackMethod: selectedAttack.method,
      defenseAction: defenseAction,
      resolution: resolution,
      attackTarget: selectedAttack.target,
      defenseTarget: defenseTarget,
      critDown: resolution.critDown,
      currentTurn: turn,
    });
  };

  /* ─── Debrief dismiss: now advance turn / check win ─── */
  const handleDebriefDismiss = () => {
    const data = debriefData;
    setDebriefData(null);

    if (data.critDown >= 2) {
      setResult("attacker");
      aLog("\u2588\u2588 CRITICAL BREACH \u2014 NETWORK OWNED \u2588\u2588");
      return;
    }

    if (data.currentTurn >= MAX_TURNS) {
      setResult("defender");
      dLog("\u2588\u2588 NETWORK SECURED \u2014 DEFENDER WINS \u2588\u2588");
      return;
    }

    setTurn((t) => t + 1);
    setSelectedAttack(null);
    setStep("attack");
  };

  const reset = () => {
    setNodes(initNodes());
    setTurn(1);
    setStep("attack");
    setResult(null);
    setScore({ atk: 0, def: 0 });
    setAtkLog([]);
    setDefLog([]);
    setPulse(null);
    setHotEdge(null);
    setSelectedAttack(null);
    setAttackMethod("EXPLOIT");
    setAttackTarget(null);
    setDefenseAction("PATCH");
    setDefenseTarget(null);
    setQuizOpen(null);
    setDebriefData(null);
  };

  const barColor = attackSurface > 60 ? "#ff1744" : attackSurface > 30 ? "#ffb300" : "#00e676";
  const currentStepLabel = result ? "GAME OVER" : step === "attack" ? "RED TEAM SELECTING ATTACK" : "BLUE TEAM SELECTING DEFENSE";

  return (
    <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", background: "#050d14", color: "#7aacbf", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>

      {/* ─── QUIZ MODAL ─── */}
      {quizOpen && (
        <QuizModal
          key={quizOpen.actionKey + "-" + Date.now()}
          actionKey={quizOpen.actionKey}
          team={quizOpen.team}
          onPass={quizOpen.callback}
          onCancel={() => setQuizOpen(null)}
        />
      )}

      {/* ─── DEBRIEF PANEL ─── */}
      {debriefData && (
        <DebriefPanel
          attackMethod={debriefData.attackMethod}
          defenseAction={debriefData.defenseAction}
          resolution={debriefData.resolution}
          attackTarget={debriefData.attackTarget}
          defenseTarget={debriefData.defenseTarget}
          onDismiss={handleDebriefDismiss}
        />
      )}

      {/* ─── HEADER ─── */}
      <div style={{ background: "#030a10", borderBottom: "1px solid #0c2e45", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "15px", fontWeight: 900, color: "#00d4ff", letterSpacing: "4px" }}>CYBER WARZONE</span>
          <span style={{ fontSize: "11px", color: "#ff5252", letterSpacing: "1px" }}>{"\u25C8"} RED</span>
          <span style={{ fontSize: "11px", color: "#444" }}>vs</span>
          <span style={{ fontSize: "11px", color: "#00e676", letterSpacing: "1px" }}>{"\u25C8"} BLUE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "11px" }}>
          <span>
            TURN <span style={{ color: "#fff", fontSize: "13px" }}>{Math.min(turn, MAX_TURNS)}</span>
            <span style={{ color: "#2a5a70" }}>/{MAX_TURNS}</span>
          </span>
          <span style={{ color: "#ff5252" }}>ATK <span style={{ color: "#ff1744", fontSize: "14px", fontWeight: "bold" }}>{score.atk}</span></span>
          <span style={{ color: "#00e676" }}>DEF <span style={{ fontSize: "14px", fontWeight: "bold" }}>{score.def}</span></span>
          <span style={{ color: step === "attack" ? "#ffb300" : "#69f0ae", letterSpacing: "1px" }}>{currentStepLabel}</span>
          {result && <span className="win-banner" style={{ color: result === "attacker" ? "#ff1744" : "#00e676", fontFamily: "'Orbitron', monospace", fontSize: "12px", padding: "4px 10px", border: "1px solid currentColor", borderRadius: "2px" }}>{result === "attacker" ? "\u26A0 BREACH" : "\u2713 SECURED"}</span>}
        </div>
      </div>

      {/* ─── MAIN BODY ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* ─── TOPOLOGY MAP ─── */}
        <div style={{ flex: "0 0 auto", width: "620px", position: "relative", borderRight: "1px solid #0c2e45", background: "radial-gradient(ellipse at 50% 50%, #091a28 0%, #050d14 75%)", overflow: "hidden" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0L0 0 0 32" fill="none" stroke="#0d2e42" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.7" />
          </svg>

          <svg width="620" height="520" viewBox="0 0 620 520">
            <defs>
              {["glow-secure", "glow-vulnerable", "glow-compromised"].map((fid) => (
                <filter key={fid} id={fid} x="-60%" y="-60%" width="220%" height="220%">
                  <feGaussianBlur stdDeviation="5" in="SourceGraphic" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
            </defs>

            {EDGES.map(([a, b], i) => {
              const na = NODES.find((n) => n.id === a);
              const nb = NODES.find((n) => n.id === b);
              if (!na || !nb) return null;
              const isHot = hotEdge && ((hotEdge.from === a && hotEdge.to === b) || (hotEdge.from === b && hotEdge.to === a));
              const isActive = nodeMap[a]?.status !== "secure" || nodeMap[b]?.status !== "secure";
              return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={isHot ? "#ff1744" : isActive ? "#1a4a60" : "#0d2e40"} strokeWidth={isHot ? 2.5 : 1} strokeDasharray={isHot ? "8 5" : undefined} className={isHot ? "dash-flow" : undefined} opacity={isHot ? 1 : 0.8} />;
            })}

            {nodes.map((node) => {
              const c = COLORS[node.status];
              const r = node.crit ? 34 : 26;
              const filter = `url(#glow-${node.status})`;
              const isPulsing = pulse?.nodeId === node.id;
              const pulseColor = pulse?.type === "atk" ? "#ff1744" : pulse?.type === "blk" ? "#00d4ff" : "#00e676";
              const isReachable = reachable.includes(node.id);
              const isSelectedAttack = selectedAttack?.target === node.id || attackTarget === node.id;
              const isSelectedDefense = defenseTarget === node.id && step === "defense";

              return (
                <g key={node.id} className="node-group">
                  {isPulsing && <>
                    <circle cx={node.x} cy={node.y} r={r} fill="none" stroke={pulseColor} strokeWidth="2.5" className={pulse?.type === "atk" ? "pulse-atk" : pulse?.type === "blk" ? "pulse-blk" : "pulse-def"} />
                    <circle cx={node.x} cy={node.y} r={r} fill="none" stroke={pulseColor} strokeWidth="1" opacity="0.5" className={pulse?.type === "atk" ? "pulse-atk" : "pulse-def"} style={{ animationDelay: "0.2s" }} />
                  </>}
                  {isReachable && <circle cx={node.x} cy={node.y} r={r + 8} fill="none" stroke="#ffb300" strokeWidth="1" opacity="0.18" />}
                  {isSelectedAttack && <circle cx={node.x} cy={node.y} r={r + 12} fill="none" stroke="#ff1744" strokeWidth="1.5" opacity="0.9" />}
                  {isSelectedDefense && <circle cx={node.x} cy={node.y} r={r + 15} fill="none" stroke="#00e676" strokeWidth="1.5" opacity="0.9" />}
                  {node.crit && <polygon points={`${node.x},${node.y - r - 10} ${node.x + r + 10},${node.y} ${node.x},${node.y + r + 10} ${node.x - r - 10},${node.y}`} fill="none" stroke={c.stroke} strokeWidth="1" opacity="0.25" />}
                  <circle cx={node.x} cy={node.y} r={r} fill={c.fill} stroke={c.stroke} strokeWidth={node.crit ? 2.5 : 1.5} filter={filter} />
                  <text x={node.x} y={node.y - 5} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize={node.crit ? "10.5" : "9.5"} fontWeight="bold" fill={c.text}>{node.label}</text>
                  <text x={node.x} y={node.y + 8} textAnchor="middle" fontFamily="'Share Tech Mono', monospace" fontSize="7.5" fill={c.stroke} opacity="0.75">{node.status.toUpperCase()}</text>
                </g>
              );
            })}

            <text x="12" y="22" fontFamily="'Share Tech Mono', monospace" fontSize="9" fill="#0d3a52">NETWORK TOPOLOGY</text>
            <text x="12" y="510" fontFamily="'Share Tech Mono', monospace" fontSize="9" fill="#0d3a52">NODES: {nodes.length} | COMPROMISED: {nodes.filter((n) => n.status === "compromised").length} | SURFACE: {attackSurface}%</text>
          </svg>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: "340px" }}>
          {/* ─── ATTACK / DEFENSE CONTROLS ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", borderBottom: "1px solid #0c2e45", background: "#04111a" }}>
            <div style={{ border: "1px solid #3a151f", padding: "10px", borderRadius: "4px", background: "#070d12" }}>
              <div style={{ fontSize: "10px", color: "#ff5252", marginBottom: "8px", letterSpacing: "2px" }}>RED TEAM — ATTACK PANEL</div>
              <div style={{ fontSize: "10px", color: "#6e8798", marginBottom: "8px" }}>Choose a method and a reachable target.</div>
              <select value={attackMethod} disabled={step !== "attack" || !!result} onChange={(e) => setAttackMethod(e.target.value)} style={{ width: "100%", marginBottom: "8px", background: "#08141e", color: "#d5ebf4", border: "1px solid #21394a", padding: "8px" }}>
                {ATTACK_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
              <select value={attackTarget || ""} disabled={step !== "attack" || !!result} onChange={(e) => setAttackTarget(e.target.value)} style={{ width: "100%", marginBottom: "8px", background: "#08141e", color: "#d5ebf4", border: "1px solid #21394a", padding: "8px" }}>
                {validTargetsForMethod.map((id) => <option key={id} value={id}>{nodeMap[id]?.label}</option>)}
              </select>
              <div style={{ fontSize: "9px", color: "#ffb3c0", minHeight: "30px", marginBottom: "8px" }}>{ATTACK_COPY[attackMethod]}</div>
              <button onClick={handleLockAttack} disabled={step !== "attack" || !attackTarget || !!result} style={{ width: "100%", padding: "10px", background: step === "attack" && !result ? "#1a0b10" : "#07111a", color: step === "attack" && !result ? "#ff7070" : "#466173", border: "1px solid #7a2737", borderRadius: "3px", cursor: step === "attack" && !result ? "pointer" : "not-allowed" }}>LOCK ATTACK</button>
            </div>

            <div style={{ border: "1px solid #163424", padding: "10px", borderRadius: "4px", background: "#070d12" }}>
              <div style={{ fontSize: "10px", color: "#00e676", marginBottom: "8px", letterSpacing: "2px" }}>BLUE TEAM — DEFENSE PANEL</div>
              <div style={{ fontSize: "10px", color: "#6e8798", marginBottom: "8px" }}>Choose where to defend after Red reveals the attack.</div>
              <select value={defenseAction} disabled={step !== "defense" || !!result} onChange={(e) => setDefenseAction(e.target.value)} style={{ width: "100%", marginBottom: "8px", background: "#08141e", color: "#d5ebf4", border: "1px solid #21394a", padding: "8px" }}>
                {DEFENSE_ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
              </select>
              <select value={defenseTarget || ""} disabled={step !== "defense" || !!result} onChange={(e) => setDefenseTarget(e.target.value)} style={{ width: "100%", marginBottom: "8px", background: "#08141e", color: "#d5ebf4", border: "1px solid #21394a", padding: "8px" }}>
                {nodes.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}
              </select>
              <div style={{ fontSize: "9px", color: "#9fffc9", minHeight: "30px", marginBottom: "8px" }}>{DEFENSE_COPY[defenseAction]}</div>
              <button onClick={handleResolveTurn} disabled={step !== "defense" || !selectedAttack || !defenseTarget || !!result} style={{ width: "100%", padding: "10px", background: step === "defense" && !result ? "#091b12" : "#07111a", color: step === "defense" && !result ? "#6dffb0" : "#466173", border: "1px solid #1f7549", borderRadius: "3px", cursor: step === "defense" && !result ? "pointer" : "not-allowed" }}>RESOLVE TURN</button>
            </div>
          </div>

          {/* ─── LOGS ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", flex: 1, minHeight: 0 }}>
            <div ref={atkRef} style={{ overflowY: "auto", padding: "12px", borderRight: "1px solid #0c2e45" }}>
              <div style={{ fontSize: "10px", color: "#ff1744", marginBottom: "8px", letterSpacing: "2px" }}>{"\u25C8"} RED TEAM — ATTACK LOG</div>
              {atkLog.length === 0 ? <div style={{ fontSize: "10px", color: "#0d2e40" }}><span style={{ animation: "blink 1.2s infinite" }}>_</span> Awaiting signal...</div> : atkLog.map((e) => <div key={e.id} className="log-line" style={{ fontSize: "11px", lineHeight: "1.55", color: e.msg.startsWith("\u2501") ? "#ff174440" : e.msg.startsWith("COMPROMISED") ? "#ff5252" : e.msg.startsWith("DEGRADED") ? "#ffb300" : "#ff7070", borderLeft: `2px solid ${e.msg.startsWith("\u2501") ? "#1a1520" : "#ff174430"}`, padding: "1px 6px", marginBottom: "1px", whiteSpace: "pre-wrap" }}>{e.msg}</div>)}
            </div>

            <div ref={defRef} style={{ overflowY: "auto", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#00e676", marginBottom: "8px", letterSpacing: "2px" }}>{"\u25C8"} BLUE TEAM — DEFENSE LOG</div>
              {defLog.length === 0 ? <div style={{ fontSize: "10px", color: "#0d2e40" }}><span style={{ animation: "blink 1.2s infinite" }}>_</span> Awaiting signal...</div> : defLog.map((e) => <div key={e.id} className="log-line" style={{ fontSize: "11px", lineHeight: "1.55", color: e.msg.startsWith("\u2501") ? "#00e67640" : e.msg.startsWith("BLOCKED") || e.msg.startsWith("DETECTED") || e.msg.startsWith("RESTORED") || e.msg.startsWith("HARDENED") ? "#00e676" : "#69f0ae", borderLeft: `2px solid ${e.msg.startsWith("\u2501") ? "#0a2a1a" : "#00e67630"}`, padding: "1px 6px", marginBottom: "1px", whiteSpace: "pre-wrap" }}>{e.msg}</div>)}
            </div>
          </div>

          {/* ─── FOOTER STATS ─── */}
          <div style={{ flexShrink: 0, padding: "14px", background: "#030a10", borderTop: "1px solid #0c2e45" }}>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", letterSpacing: "1px", marginBottom: "5px" }}>
                <span style={{ color: "#1a4a60" }}>ATTACK SURFACE EXPOSURE</span>
                <span style={{ color: barColor }}>{attackSurface}%</span>
              </div>
              <div style={{ height: "3px", background: "#08141e", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${attackSurface}%`, background: barColor, boxShadow: `0 0 8px ${barColor}80`, transition: "width 0.6s ease, background 0.6s ease" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
              {[ ["secure", "#00e676"], ["vulnerable", "#ffb300"], ["compromised", "#ff1744"] ].map(([status, color]) => (
                <div key={status} style={{ flex: 1, textAlign: "center", padding: "5px 4px", background: "#08141e", borderRadius: "2px", border: `1px solid ${color}22` }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color, lineHeight: 1 }}>{nodes.filter((n) => n.status === status).length}</div>
                  <div style={{ fontSize: "8px", color, opacity: 0.6, marginTop: "2px", letterSpacing: "1px" }}>{status.slice(0, 4).toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={reset} style={{ flex: 1, padding: "10px", background: "#07111a", border: "1px solid #0c2e45", color: "#2a5a70", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", borderRadius: "2px" }}>{"\u21BA"} RESET GAME</button>
            </div>

            <div style={{ marginTop: "8px", fontSize: "9px", color: "#0d3a52", textAlign: "center", letterSpacing: "2px" }}>
              {result ? <span style={{ color: result === "attacker" ? "#ff1744" : "#00e676" }}>SIM COMPLETE {"\u00B7"} {result === "attacker" ? "BREACH CONFIRMED" : "NETWORK HELD"}</span> : <span>{step === "attack" ? "RED TEAM: CHOOSE ROUTE OF ATTACK" : "BLUE TEAM: CHOOSE ROUTE OF DEFENSE"}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
