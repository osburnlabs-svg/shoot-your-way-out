# Strategy: Monetization Design v1

**Status:** Strategic design only. Not scheduled for implementation. Target post-v1 launch — likely Phase 9 (ads + IAP foundation) and Phase 10 (quest + flea market system). All numbers in this document are placeholders to be re-tuned during Phase 9/10 against actual gameplay data from a Phase 5+ build.

---

## 1. Core philosophy

- **Minimal monetization that respects player time.** No intrusive ads, no banner ads, no forced interstitials.
- **Two payment paths for the same effect.** Where possible, give players a choice: watch an ad OR spend earned currency. Same outcome, different cost.
- **Gameplay-mechanic monetization over cosmetic.** Skins and weapon variants don't read visually in a top-down survivor game (player only sees arms and head). Meta-game features are the right hook.
- **Free players retain meaningful gameplay.** The flea market is not paywalled. Only quest progression is. Free players earn slowly through currency drops; paid players accelerate through quests.

---

## 2. What's locked from existing context

These came into the strategy from the v3 context doc, unchanged:

- No intrusive ads of any kind
- One ad per run, player-initiated, for revive (Phase 4b G3 already implements the stub button)
- Optional pre-run buff ad — player watches an ad before a run to start with one random skill applied

---

## 3. New design: paywalled quest system

### 3.1 Concept

A one-time IAP unlocks a daily quest system. Three quests rotate daily. Player can accept or ignore. Completing a quest pays out flea-market currency.

**Free players** get 1 random quest per day from the day's 3 rotation.
**Paid players** get all 3 quests per day.

This is the only paywall in the game.

### 3.2 Pricing target

Not locked. Reasonable range based on the genre: **$4.99 to $9.99.** Single tier (no premium / supporter / etc. — keep it simple). Final price decision deferred until Phase 9/10 planning when player engagement data exists.

### 3.3 Quest pool (target ~28 templates)

**Combat — enemy type quests** (some require Phase 5+ enemies):

- Kill 25 / 100 Scavs
- Kill 10 / 50 Raiders
- Kill 5 / 25 Spec Ops *(Phase 5+)*
- Kill 3 / 15 Snipers *(Phase 5+)*
- Kill 100 enemies total
- Kill 500 enemies cumulative across runs

**Combat — throwable quests:**

- Throw 20 / 50 Frag Grenades
- Throw 15 Molotovs
- Throw 10 Smoke Grenades

**Survival / time:**

- Survive 3 / 8 / 15 minutes
- Don't take damage for 60 seconds straight
- Don't take damage for 2 minutes straight

**Progression:**

- Reach level 5 / 10 / 15 in one run
- Reach level 10 without using a revive
- Acquire 8 different skills in one run
- Max out (5-stack) any single skill

**Exploration / loot:**

- Pick up 5 / 15 crates in one run
- Equip 3 different crate weapons in one run
- Collect $200 / $500 in a single run
- Collect $5000 cumulative across runs

**Composite (combine simple counters):**

- Kill 50 enemies AND survive 5 minutes
- Reach level 10 AND don't die
- Pick up 5 crates AND equip 2 of them

### 3.4 Payout tiers

| Tier | Difficulty | Payout |
|---|---|---|
| Small | Easy, 1 run | $100-200 |
| Medium | Solid run or 2-3 runs | $300-500 |
| Large | Multi-run or challenging | $750-1500 |

Daily rotation typically picks 1 of each tier so the day's three quests range from easy to hard.

### 3.5 Quest tracking complexity

All quest templates use **simple counters**. No weapon-attribution tracking required. The hard quest types (kills by weapon type, zone-attributed kills, distance-attributed kills) are deferred out of scope — too much engine work for v1 monetization.

Per-run vs cumulative:

- **~80% per-run** ("complete in a single run") — forces focused play
- **~20% cumulative** ("kill 500 enemies total across all runs") — gives grind-incentive quests

### 3.6 Daily rotation

- Three quests per day, rotated at midnight device-local time
- Device-time-based rotation accepted; exploit risk (set phone forward) deemed minor and acceptable
- Server-time rotation can be added post-launch if abuse becomes a real problem (single function change)

---

## 4. New design: flea market (NOT paywalled)

### 4.1 Concept

A pre-run shop where players spend earned currency to start a run with one bonus. Two purchase paths:

- **Watch an ad** → start with 1 random skill at 1 stack (existing planned mechanic, no change)
- **Spend flea market currency** → start with 1 *chosen* skill at 1 stack OR start with a chosen weapon

Same gameplay effect (start with skill applied). Currency adds the ability to *choose which* skill.

### 4.2 Flea market inventory

**Skills (20 base + clones):** every skill in the game is purchasable for one run. Selecting one applies 1 stack of that skill when the run starts.

**Weapons (7 total):** every weapon is purchasable. Buying adds the weapon to the player's run alongside the starter Pistol (does NOT replace Pistol). Aligns with Phase 7's weapon-inventory design.

**Pricing intent (placeholder, re-tune Phase 9/10):**

- Cheapest skills: $100-150 (reachable in ~1 run of free play)
- Average skills: $300-500 (a few runs of grinding)
- Premium skills: $700-1000 (multi-run grind)
- Weapons: $2000-5000 (significant investment, or quest-grind accelerated for paid players)

The intent is that free players can buy something every few runs, paid players (via quests) can buy more frequently.

### 4.3 Flea market UI

- Reuses existing skill card art and weapon HUD icons — no new visual work needed
- Scrollable grid/list of all available items with currency price and BUY button
- Label is "Flea Market" instead of the level-up "Upgrade" framing
- Selected item is held as `pendingStarterItem` on persistent state, cleared when run begins
- Free players can browse and buy without paywall

### 4.4 Edge case: buying a duplicate

Phase 7's weapon inventory design specifies: if a player EQUIPs a weapon they already have, the game switches active to it but doesn't add a duplicate. **Same logic applies to flea market weapon purchases.** Buying SMG when already owning SMG simply doesn't add a duplicate (and ideally should warn or refund — implementation detail for Phase 10).

---

## 5. Currency economy

### 5.1 Currency source

In-run money pickups drop from kills. Each pickup grants both XP (existing behavior) **and** flea-market currency (new). No split — both effects from one pickup.

**Currency rate (placeholder):** ~$1 per Scav kill, scaled up per enemy tier. Roughly $50 per run at the current Phase 4 baseline of 50 kills/run.

This number re-tunes during Phase 9/10 against actual Phase 5+ run length and enemy density. The shape is:

- Free player average run: ~50-150 in-run currency
- Paid player average run with completed quest: ~150-650 currency (in-run + quest payout)
- A cheap skill costs ~1-3 free runs OR 1-2 paid runs

### 5.2 Currency persistence

`flea_currency: number` on persistent player data. Survives between runs, never resets. New persistence system required (currently the game has no persistent player state).

### 5.3 Balance philosophy

- Free play feels rewarding (you ARE earning, just slowly)
- Quest play feels accelerated (you're buying things noticeably faster)
- The gap is the conversion incentive — players who enjoy the game eventually want to grind faster, which is what the paywall sells

---

## 6. Free vs paid player experience

| Feature | Free | Paid |
|---|---|---|
| Full gameplay (all skills, weapons, modes) | ✓ | ✓ |
| Revive ad on death | ✓ | ✓ |
| Pre-run buff ad (random skill) | ✓ | ✓ |
| Flea market (currency-based) | ✓ | ✓ |
| In-run currency drops | ✓ | ✓ |
| Daily quests | 1 of 3 random per day | All 3 per day |
| Quest payouts | Yes (1 per day) | Yes (3 per day) |
| Removes ads | No | No (revive/buff ads stay) |

**Free players are not locked out of the meta-game.** They earn slower, that's all.

---

## 7. New skill clones (no engine code, just data + sprites)

To increase player perception of variety in the random skill draw pool, add reskinned versions of existing stat-modifier skills. Same engine code, new name, new icon, slightly different numbers.

**Locked policy:** Skill clones differ from originals by **percentage adjustments**. Same field (e.g. `damageMultAdd`), different value. The engine already handles additive stacking — clones just provide new entries in the random pool.

### 7.1 First batch (5 clones, source when ready)

| # | Skill name | Effect | Mechanically a clone of | Sprite direction |
|---|---|---|---|---|
| 1 | Heavy Plate | -12% damage taken | Plate Carrier | Heavier military armor vest |
| 2 | Knee Pads | -6% damage taken | Ceramic Insert | Tactical knee pads |
| 3 | FMJ Ammo | +18% damage | AP Rounds | Premium ammo box / FMJ cartridges |
| 4 | ACOG | +12% range | Red Dot | Combat optic / scope |
| 5 | Energy Bar | +12 max HP | MRE | Protein bar / food pack |

### 7.2 Future batches

Additional 5-10 clones can be added in any later batch. Same one-line-edit workflow as the Phase 4b skill icon swap. Each new skill is one PNG drop + one data row in `data/skills.ts` + one icon mapping in `sprites.ts`.

### 7.3 Clone design principles

- **Differ by meaningful percentage** (±20-30% from original) so clones feel distinct, not identical-with-different-name
- **Match the kit's military/Tarkov aesthetic** in naming — avoid fantasy or generic gaming names
- **Don't clone active-effect skills** (Frag/Smoke/Molotov throwables) — clones would feel like timing variants
- **Don't clone trade-off skills** (Stims, Helmet) — their unique design is the appeal; clones dilute it
- **Don't clone single-use skills** (Backpack revive, Field Medic Kit on-pickup heal) — binary features

---

## 8. Implementation scope estimate

Honest rough estimate. Phase 5+ context (longer runs, more enemy types) changes specifics but the shape holds:

**Phase 9 — Monetization foundation**

- IAP SDK integration (paywall check)
- Rewarded ad SDK integration (replaces revive-ad and pre-run-buff-ad stubs)
- License verification and entitlement caching
- Initial persistence layer

**Phase 10 — Quest + flea market system**

- Persistent flea_currency state
- Currency drop logic (route money pickups to currency)
- Flea market UI screen
- Pre-run starter skill/weapon state on persistent player data
- Quest definitions (data file)
- Quest tracking (counter increments in engine)
- Daily rotation logic with device-time check
- Quest screen UI (active quests, progress, claim payout)
- Paywall gate on quest count (free=1, paid=3)
- Quest payout to currency
- Balance pass: tune currency drops, quest payouts, item prices against actual Phase 5+ gameplay

**Estimated build size:** roughly two phases worth of work. Phase 9 is mostly engineering and SDK integration. Phase 10 is the user-facing meta-game build.

---

## 9. Open questions deferred to Phase 9/10 planning

1. **Specific IAP price.** $4.99 vs $9.99 — decide closer to launch with player data and price sensitivity research.
2. **In-run currency drop rate.** Current $1/Scav is a placeholder. Tune against actual Phase 5+ run length.
3. **Item price specifics in flea market.** Same — placeholders, tune later.
4. **Quest payout amounts.** Same — placeholders.
5. **Server-time vs device-time for daily rotation.** Default to device-time, swap to server-time if abuse becomes real.
6. **What happens to flea-market starter items if player dies before run starts.** (Edge case: do they consume? Refund? Persist for next run?)
7. **Quest difficulty re-tuning.** Some quests (Scav kill counts, money totals) need re-scaling once Phase 5+ baselines are known.
8. **Free player retention strategy.** If free players churn at "I can't afford things," reconsider whether currency drops need to be more generous.

---

## 10. What this document is NOT

- A commitment to build any of this. The design is reasoned and locked, but Phases 9/10 are far from current development.
- A pricing study. Numbers here are placeholders for design conversation, not market-tested values.
- An authoritative F2P design. Genuine F2P design expertise is outside the design conversations this doc captures. Worth consulting a specialist before final pricing/balancing decisions are made.
