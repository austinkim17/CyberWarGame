# Cyber Attack Excercise --> Class: Ai and national security
## Learning objective

users to familiarize themselves with cyberattack related terms

## Brief Project Description

Before users can press "LOCK ATTACK" and "RESOLVE TURN," a pop-up window appears to ask the user to confirm that they understand the move they are selecting. In the pop-up window, list 3 multiple-choice answers, 2 incorrect and 1 correct, defining what the action does.

Attack Panel Options
- Exploit targets a known vulnerability in a specific entity — it's a direct, technical attack that takes advantage of unpatched software or misconfigured systems. High damage potential, but only works if the target hasn't been patched or hardened.
- Phishing simulates a social engineering attack aimed at human-operated nodes like admins or mail servers. It doesn't brute-force a system — instead it tricks users into surrendering credentials or clicking malicious links, making it effective even against well-patched systems.
- Brute Force repeatedly attempts to guess passwords or authentication tokens on a target. It's noisy and slow, making it detectable by a monitoring defense, but it's reliable against weak credentials and requires no prior knowledge of vulnerabilities.
- Lateral Move allows the attacker to pivot from a compromised node to an adjacent one in the network. It doesn't attack from the outside — it spreads internally, making it powerful once a foothold is established and hard to stop without isolation.
- Zero Day is the attacker's most powerful card: an unknown, unpatched vulnerability that bypasses most defenses. It cannot be stopped by patch or harden, and should be rare or limited in use to keep the game balanced.

Defense Panel Responses
- Patch closes known vulnerabilities on a targeted entity, making it immune to exploit and reducing zero-day effectiveness. It's the standard preventive response and should be the most commonly available move.
- Harden goes beyond patching — it tightens configurations, removes unnecessary services, and strengthens authentication. It raises the difficulty of brute force and exploit attacks but doesn't fully block them.
- Isolate cuts a compromised or at-risk node off from the rest of the network. This is the primary counter to lateral movement — once a node is isolated, the attacker can't pivot through it. The tradeoff is that the isolated node can no longer perform its function.
- Monitor places a node under surveillance, alerting the defender when an attack is attempted. It's a counter to brute force (detecting repeated attempts) and can reveal the attacker's strategy, but it doesn't prevent damage on its own.
- Restore brings a compromised node back to a clean state, undoing the effects of a successful attack. It should take time or cost resources to balance the game, since an instant restore would eliminate much of the attacker's progress.


# AUSTIN TO ADD SHI
# Cyber Attack & Defense — Question Bank

## Attack Moves

- so when user selects on an action, a popup should come up and ask the associated multiple choice question. If the user gets the question wrong, it should just say "Sorry try again" and gray out the previously selected answer choice". repeat this until user selects correct answer --> user should then have the option to quit the text box...

### Exploit

**Q: What does the Exploit move do?**

- A) Forces the defender to skip their next turn
- B) Targets a known vulnerability in a specific node to damage it ✅
- C) Spreads damage across all nodes connected to the target

---

### Phishing

**Q: Which type of node is Phishing most effective against?**

- A) Database servers protected by weak encryption
- B) Firewalls with misconfigured rules
- C) Human-operated nodes like Admins and Mail ✅

---

### Brute Force

**Q: What makes Brute Force easy for the defender to detect?**

- A) It leaves a permanent damage marker on the attacked node
- B) It generates repeated login attempts that Monitor can catch ✅
- C) The attacker must declare the target out loud before using it

---

### Lateral Move

**Q: What condition must be true before the attacker can use Lateral Move?**

- A) The defender must have already used Isolate that round
- B) The attacker must already control an adjacent compromised node ✅
- C) The attacker must have used Zero Day on their previous turn

---

### Zero Day

**Q: Why can most defenses not stop a Zero Day attack?**

- A) Zero Day automatically targets the highest-value node on the board
- B) It exploits an unknown vulnerability that Patch and Harden can't anticipate ✅
- C) It forces the defender to discard all cards in their hand

---

## Defense Moves

### Patch

**Q: Which attack does Patch most directly counter?**

- A) Phishing, by training users to recognize suspicious messages
- B) Exploit, by closing the known vulnerability being targeted ✅
- C) Lateral Move, by sealing connections between nodes

---

### Harden

**Q: How is Harden different from Patch?**

- A) Harden can only be applied to the Gateway and Firewall nodes
- B) Harden tightens configuration and raises attack difficulty without fully blocking attacks ✅
- C) Harden permanently disables the node to make it an invalid target

---

### Isolate

**Q: What is the main reason to Isolate a node?**

- A) To restore it to a clean state after it's been compromised
- B) To cut it off from the network and prevent Lateral Move from passing through it ✅
- C) To scan neighboring nodes for incoming threats

---

### Monitor

**Q: What does Monitor do when it detects an attack?**

- A) Automatically blocks the attack and prevents all damage
- B) Alerts the defender so they can respond — but doesn't prevent damage on its own ✅
- C) Deals damage back to the attacker equal to the attack's strength

---

### Restore

**Q: What happens if the attacker compromises the Backup node before the defender uses Restore?**

- A) Nothing — Restore always succeeds regardless of the Backup's status
- B) The defender permanently loses access to the Restore move
- C) Restores either fail or produce a corrupted result, weakening the defender's recovery ✅

# CyberWarGame Development README

## Overview
This document translates the current gameplay requirements into a readable set of development checkpoints for the **CyberWarGame** project. The goal is to make implementation easier, keep the rules consistent, and ensure the game also teaches players what each cyber action actually does.

---

## Core Requirement: Confirmation Pop-Ups Before Committing Moves

Before a user can press **LOCK ATTACK** or **RESOLVE TURN**, the game must display a confirmation pop-up that verifies the player understands the move they are selecting.

### Confirmation Pop-Up Rules
- The pop-up appears **before** the move is committed.
- The pop-up is triggered when the player attempts to finalize a chosen action.
- The pop-up must contain:
  - the selected move name
  - a short prompt asking what the move does
  - **3 multiple-choice answers**
  - **1 correct answer**
  - **2 incorrect answers**
- The player must interact with the pop-up before continuing.
- This requirement applies to both:
  - **attacker actions**
  - **defender actions**

### Decision Point for Implementation
Choose one of the following behaviors:
- **Strict mode:** the player must answer correctly before the move can proceed.
- **Learning mode:** the player may continue after answering, but the correct explanation is shown first.

---

## Development Checkpoints

### 1. Build the move-confirmation system
- Add a reusable modal or pop-up component.
- Trigger it whenever a player clicks **LOCK ATTACK** or **RESOLVE TURN**.
- Prevent move submission until the confirmation flow is completed.
- Ensure the modal content updates dynamically based on the currently selected action.

### 2. Add multiple-choice learning checks for every action
- Create a question bank for every attack and defense move.
- Each move should have:
  - a short plain-English question
  - 3 answer choices
  - 1 correct choice
  - 2 believable but incorrect choices
- Keep wording consistent with the actual game logic.

### 3. Implement attack action definitions in both gameplay and UI
Each attack action should be reflected accurately in:
- the rules text
- the confirmation pop-up
- the actual mechanics

#### Exploit
- Targets a **known vulnerability** in a specific entity.
- Functions as a direct technical attack against:
  - unpatched software
  - misconfigured systems
- Has **high damage potential**.
- Should fail or become much weaker if the target has already been **patched** or **hardened**.

#### Phishing
- Represents a **social engineering** attack.
- Targets **human-operated nodes** such as:
  - admins
  - users
  - mail servers
- Works by tricking users into:
  - revealing credentials
  - clicking malicious links
- Should remain useful even when systems are otherwise well patched.

#### Brute Force
- Repeatedly attempts to guess:
  - passwords
  - authentication tokens
- Is noisy, slow, and more detectable than stealthier attacks.
- Should be particularly vulnerable to **monitoring** defenses.
- Should work best against weak credentials.

#### Lateral Move
- Lets the attacker pivot from one **already compromised** node to an adjacent one.
- Should only be available after a foothold is established.
- Does **not** represent an external first-strike attack.
- Should be strongly countered by **isolation**.

#### Zero Day
- Represents an **unknown, unpatched vulnerability**.
- Is the attacker’s most powerful move.
- Should bypass most standard defenses.
- Should **not** be fully stopped by patching or hardening.
- Should be rare, limited in use, or costly in order to preserve balance.

### 4. Implement defense action definitions in both gameplay and UI
Each defense action should also match its educational description and gameplay effect.

#### Patch
- Closes **known vulnerabilities** on a targeted entity.
- Makes the target immune to standard **exploit** attacks.
- Reduces the effectiveness of **zero-day** attacks.
- Should be the most common and widely available defensive option.

#### Harden
- Improves security beyond patching.
- Includes:
  - tighter configurations
  - fewer unnecessary services
  - stronger authentication
- Should increase resistance to:
  - exploit
  - brute-force attacks
- Should make attacks harder, but not always fully block them.

#### Isolate
- Cuts a compromised or at-risk node off from the rest of the network.
- Is the primary counter to **lateral movement**.
- Prevents the attacker from pivoting through that node.
- Should impose a tradeoff:
  - the isolated node can no longer perform its normal role or function

#### Monitor
- Places a node under surveillance.
- Alerts the defender when an attack is attempted.
- Is especially useful against **brute-force** attacks.
- Can reveal attacker behavior or strategy.
- Should provide information, but not directly prevent all damage.

#### Restore
- Returns a compromised node to a clean state.
- Reverses the effects of a successful attack.
- Should require:
  - time
  - a cooldown
  - resources
  - or another balancing cost
- Should not act as a free instant reset.

---

## Attack and Defense Interaction Checklist

The following interactions should be explicitly tested and documented:

- **Patch vs Exploit**
  - Patch should block or neutralize known-vulnerability attacks.

- **Patch vs Zero Day**
  - Patch should reduce impact, but not fully eliminate the threat.

- **Harden vs Exploit**
  - Harden should make exploitation harder or less effective.

- **Harden vs Brute Force**
  - Harden should reduce success odds or increase required effort.

- **Monitor vs Brute Force**
  - Monitor should detect repeated login attempts or noisy attack behavior.

- **Isolate vs Lateral Move**
  - Isolation should stop internal pivoting through the isolated node.

- **Restore vs Successful Attack**
  - Restore should undo compromise, but with a meaningful game cost.

- **Phishing vs Well-Patched Systems**
  - Phishing should remain viable because it targets users, not just technical weaknesses.

---

## UX and Flow Requirements

### Pop-Up Experience
- The confirmation window should be quick to read and easy to answer.
- It should appear only when the user commits a move, not when merely selecting options.
- It should not be possible to bypass the pop-up through repeated clicking or fast input.
- The wording should match the labels in the attack and defense panels.

### Feedback
- The game should clearly indicate:
  - whether the answer was correct
  - what the correct explanation is
  - whether the move can proceed
- The feedback should reinforce learning without making gameplay frustrating.

### Accessibility and Clarity
- Use plain language in questions and answers.
- Keep the answer choices concise.
- Make the correct explanation easy to understand even for users with limited cybersecurity background.

---

## Example Confirmation Questions

### Example: Exploit
**Question:** What does **Exploit** do?

- A. It attacks a known vulnerability in a specific target and works best when the system is unpatched. ✅
- B. It guesses passwords repeatedly until one works.
- C. It disconnects a target from the network to stop internal spread.

### Example: Isolate
**Question:** What does **Isolate** do?

- A. It restores a node back to a clean state after compromise.
- B. It cuts a node off from the rest of the network, stopping lateral movement but also limiting that node’s function. ✅
- C. It makes known vulnerabilities disappear by applying software updates.

---

## Balance Requirements

### Zero Day Balance
- Limit uses per game, per round, or through a resource cost.
- Prevent it from becoming a guaranteed win button.
- Make its strength feel exceptional, but not unbeatable.

### Restore Balance
- Add a cooldown, delay, or resource tradeoff.
- Prevent repeated instant cleanup from erasing all attacker progress.

### Isolate Tradeoff
- Ensure isolated nodes lose functionality.
- Isolation should be powerful defensively, but not free.

### Monitor Tradeoff
- Monitoring should provide visibility, not total prevention.
- It should be valuable for information gathering and detection.

---

## Suggested Development Order

1. Build the reusable confirmation modal.
2. Connect the modal to **LOCK ATTACK** and **RESOLVE TURN**.
3. Create a question/answer data structure for each move.
4. Add validation and feedback behavior.
5. Align move descriptions with actual game logic.
6. Test all attack/defense interactions for consistency.
7. Add README documentation and in-game help text.

---

## Testing Checklist

- [ ] Pop-up appears before **LOCK ATTACK**
- [ ] Pop-up appears before **RESOLVE TURN**
- [ ] Every attack move has 1 valid question with 3 answer choices
- [ ] Every defense move has 1 valid question with 3 answer choices
- [ ] Correct answer is clearly identified in the logic
- [ ] Wrong answers do not accidentally describe another real action
- [ ] Players cannot bypass the confirmation step
- [ ] Attack/defense effects match the educational descriptions
- [ ] Zero Day usage is limited or balanced
- [ ] Restore has a cost, timer, or cooldown
- [ ] Isolation blocks lateral movement correctly
- [ ] Monitoring detects brute-force attempts correctly

---

## Documentation Goals
This feature is not just a gameplay mechanic. It is also a teaching tool. The confirmation system should help players learn:
- what each cyber action represents
- when each action is effective
- what counters each action
- the tradeoffs involved in attack and defense decisions

The final implementation should make the game more educational, more readable, and more strategically coherent.