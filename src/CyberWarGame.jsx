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
    defEvents.push(`✓ BLOCKED: ${atkNode.label} was isolated in time.`);
  }

  if (!blocked && defense.action === "MONITOR" && attack.method === "PHISHING" && defense.target === attack.target) {
    blocked = true;
    defenderPoint += 1;
    defEvents.push(`✓ DETECTED: phishing against ${atkNode.label} was caught and contained.`);
  }

  if (!blocked) {
    if (atkNode.status === "secure") {
      atkNode.status = "vulnerable";
      atkEvents.push(`⚠ DEGRADED: ${atkNode.label} → VULNERABLE`);
    } else if (atkNode.status === "vulnerable") {
      atkNode.status = "compromised";
      attackerPoint += 1;
      atkEvents.push(`✓ COMPROMISED: ${atkNode.label}`);
    }
  }

  if (defense.action === "PATCH" || defense.action === "RESTORE") {
    if (defNode.status !== "secure") {
      defNode.status = "secure";
      defEvents.push(`✓ RESTORED: ${defNode.label}`);
    } else {
      defEvents.push(`• ${defNode.label} was already secure.`);
    }
  }

  if (defense.action === "HARDEN") {
    if (defNode.status === "secure") {
      defEvents.push(`✓ HARDENED: ${defNode.label} remains difficult to breach.`);
    } else {
      defNode.status = "secure";
      defEvents.push(`✓ HARDENED: ${defNode.label} pushed back to SECURE.`);
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');
  @keyframes atkPulse { 0% { r: 30; opacity: 0.9; } 100% { r: 62; opacity: 0; } }
  @keyframes defPulse { 0% { r: 30; opacity: 0.9; } 100% { r: 55; opacity: 0; } }
  @keyframes dashFlow { to { stroke-dashoffset: -24; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes winPulse { 0%,100% { box-shadow: 0 0 8px currentColor; } 50% { box-shadow: 0 0 24px currentColor; } }
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

  const previewAttack = () => {
    if (!attackTarget) return;
    const node = NODES.find((n) => n.id === attackTarget);
    const edge = findEdgeForTarget(nodes, attackTarget);
    if (edge) setHotEdge({ from: edge[0], to: edge[1], type: "atk" });
    setPulse({ nodeId: attackTarget, type: "atk" });
    setSelectedAttack({ target: attackTarget, method: attackMethod });
    aLog(`━━━━ TURN ${turn}/${MAX_TURNS} ━━━━`);
    aLog(`> TARGET: ${node?.label} via ${attackMethod}`);
    aLog(`> ${getAttackNarrative(node?.label || attackTarget, attackMethod)}`);
    setStep("defense");
  };

  const resolveTurn = async () => {
    if (!selectedAttack || !defenseTarget || result) return;

    const attackNode = NODES.find((n) => n.id === selectedAttack.target);
    const defendNode = NODES.find((n) => n.id === defenseTarget);

    dLog(`━━━━ TURN ${turn}/${MAX_TURNS} ━━━━`);
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

    if (resolution.critDown >= 2) {
      setResult("attacker");
      aLog("██ CRITICAL BREACH — NETWORK OWNED ██");
      return;
    }

    if (turn >= MAX_TURNS) {
      setResult("defender");
      dLog("██ NETWORK SECURED — DEFENDER WINS ██");
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
  };

  const barColor = attackSurface > 60 ? "#ff1744" : attackSurface > 30 ? "#ffb300" : "#00e676";
  const currentStepLabel = result ? "GAME OVER" : step === "attack" ? "RED TEAM SELECTING ATTACK" : "BLUE TEAM SELECTING DEFENSE";

  return (
    <div style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace", background: "#050d14", color: "#7aacbf", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{CSS}</style>

      <div style={{ background: "#030a10", borderBottom: "1px solid #0c2e45", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "15px", fontWeight: 900, color: "#00d4ff", letterSpacing: "4px" }}>CYBER WARZONE</span>
          <span style={{ fontSize: "11px", color: "#ff5252", letterSpacing: "1px" }}>◈ RED</span>
          <span style={{ fontSize: "11px", color: "#444" }}>vs</span>
          <span style={{ fontSize: "11px", color: "#00e676", letterSpacing: "1px" }}>◈ BLUE</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "11px" }}>
          <span>
            TURN <span style={{ color: "#fff", fontSize: "13px" }}>{Math.min(turn, MAX_TURNS)}</span>
            <span style={{ color: "#2a5a70" }}>/{MAX_TURNS}</span>
          </span>
          <span style={{ color: "#ff5252" }}>ATK <span style={{ color: "#ff1744", fontSize: "14px", fontWeight: "bold" }}>{score.atk}</span></span>
          <span style={{ color: "#00e676" }}>DEF <span style={{ fontSize: "14px", fontWeight: "bold" }}>{score.def}</span></span>
          <span style={{ color: step === "attack" ? "#ffb300" : "#69f0ae", letterSpacing: "1px" }}>{currentStepLabel}</span>
          {result && <span className="win-banner" style={{ color: result === "attacker" ? "#ff1744" : "#00e676", fontFamily: "'Orbitron', monospace", fontSize: "12px", padding: "4px 10px", border: "1px solid currentColor", borderRadius: "2px" }}>{result === "attacker" ? "⚠ BREACH" : "✓ SECURED"}</span>}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
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

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: "340px" }}>
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
              <button onClick={previewAttack} disabled={step !== "attack" || !attackTarget || !!result} style={{ width: "100%", padding: "10px", background: step === "attack" && !result ? "#1a0b10" : "#07111a", color: step === "attack" && !result ? "#ff7070" : "#466173", border: "1px solid #7a2737", borderRadius: "3px", cursor: step === "attack" && !result ? "pointer" : "not-allowed" }}>LOCK ATTACK</button>
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
              <button onClick={resolveTurn} disabled={step !== "defense" || !selectedAttack || !defenseTarget || !!result} style={{ width: "100%", padding: "10px", background: step === "defense" && !result ? "#091b12" : "#07111a", color: step === "defense" && !result ? "#6dffb0" : "#466173", border: "1px solid #1f7549", borderRadius: "3px", cursor: step === "defense" && !result ? "pointer" : "not-allowed" }}>RESOLVE TURN</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", flex: 1, minHeight: 0 }}>
            <div ref={atkRef} style={{ overflowY: "auto", padding: "12px", borderRight: "1px solid #0c2e45" }}>
              <div style={{ fontSize: "10px", color: "#ff1744", marginBottom: "8px", letterSpacing: "2px" }}>◈ RED TEAM — ATTACK LOG</div>
              {atkLog.length === 0 ? <div style={{ fontSize: "10px", color: "#0d2e40" }}><span style={{ animation: "blink 1.2s infinite" }}>_</span> Awaiting signal...</div> : atkLog.map((e) => <div key={e.id} className="log-line" style={{ fontSize: "11px", lineHeight: "1.55", color: e.msg.startsWith("━") ? "#ff174440" : e.msg.startsWith("✓") ? "#ff5252" : e.msg.startsWith("⚠") ? "#ffb300" : "#ff7070", borderLeft: `2px solid ${e.msg.startsWith("━") ? "#1a1520" : "#ff174430"}`, padding: "1px 6px", marginBottom: "1px", whiteSpace: "pre-wrap" }}>{e.msg}</div>)}
            </div>

            <div ref={defRef} style={{ overflowY: "auto", padding: "12px" }}>
              <div style={{ fontSize: "10px", color: "#00e676", marginBottom: "8px", letterSpacing: "2px" }}>◈ BLUE TEAM — DEFENSE LOG</div>
              {defLog.length === 0 ? <div style={{ fontSize: "10px", color: "#0d2e40" }}><span style={{ animation: "blink 1.2s infinite" }}>_</span> Awaiting signal...</div> : defLog.map((e) => <div key={e.id} className="log-line" style={{ fontSize: "11px", lineHeight: "1.55", color: e.msg.startsWith("━") ? "#00e67640" : e.msg.startsWith("✓") ? "#00e676" : "#69f0ae", borderLeft: `2px solid ${e.msg.startsWith("━") ? "#0a2a1a" : "#00e67630"}`, padding: "1px 6px", marginBottom: "1px", whiteSpace: "pre-wrap" }}>{e.msg}</div>)}
            </div>
          </div>

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
              <button onClick={reset} style={{ flex: 1, padding: "10px", background: "#07111a", border: "1px solid #0c2e45", color: "#2a5a70", fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "1px", cursor: "pointer", borderRadius: "2px" }}>↺ RESET GAME</button>
            </div>

            <div style={{ marginTop: "8px", fontSize: "9px", color: "#0d3a52", textAlign: "center", letterSpacing: "2px" }}>
              {result ? <span style={{ color: result === "attacker" ? "#ff1744" : "#00e676" }}>SIM COMPLETE · {result === "attacker" ? "BREACH CONFIRMED" : "NETWORK HELD"}</span> : <span>{step === "attack" ? "RED TEAM: CHOOSE ROUTE OF ATTACK" : "BLUE TEAM: CHOOSE ROUTE OF DEFENSE"}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
