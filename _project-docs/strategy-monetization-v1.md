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

## 11. Weapon Rarity Tiers

**Status:** Graduated from brainstorm session (date: 2026-05-12). Locked design. Not yet scheduled for implementation — target post-Phase 5 once weapon system is stable in the procedural map context.

### 11.1 Concept

Every crate-droppable weapon has 4 rarity tiers. Each tier applies a flat damage multiplier and a visual color treatment. Drop rates weighted so legendary feels rare and exciting. Solves the post-Phase 4c gameplay observation that crates become uninteresting once the player obtains a desired weapon (e.g. Shotgun) — rarity gives the player a reason to keep opening crates even after they have a weapon they like.

This is genre-standard for survivor-likes, roguelikes, and ARPGs (Vampire Survivors evolutions, Brotato item tiers, Hades boon rarities, Diablo loot tiers). The pattern is recognized instantly by any player who has touched the genre — no tutorial needed.

### 11.2 Tier definitions

| Tier | Color | Damage multiplier |
|---|---|---|
| Common | Green | 1.00x (base) |
| Uncommon | Blue | 1.10x |
| Rare | Purple | 1.20x |
| Legendary | Gold | 1.30x |

Multiplier is **additive from base**, not compounding. A Legendary Shotgun deals 30% more damage than a Common Shotgun, period.

Color order matches genre convention (Green → Blue → Purple → Gold ascending). Players have 20+ years of trained intuition reading these colors at a glance.

### 11.3 Drop rate target

Target feeling: **1 legendary per 5-7 minutes of play.** Placeholder weighting:

| Tier | Weight |
|---|---|
| Common | 50% |
| Uncommon | 30% |
| Rare | 15% |
| Legendary | 5% |

These weights are placeholders. Exact percentages tune against actual Phase 5+ gameplay once crate spawn rate, run length, and player kill cadence are observable.

### 11.4 Stat-only design (no unique modifiers)

Legendaries differ from commons by stat multipliers only. No unique behavioral effects per legendary weapon (no "Legendary Shotgun ignites enemies" or similar). This keeps engine work minimal — the weapon system already supports stat profiles; rarity is just a multiplier on top.

This is a conscious tradeoff. Unique legendary modifiers would be more memorable per-weapon but would require per-weapon engine code, balance complexity, and visual differentiation. Stat-only legendaries are 95% of the engagement at 10% of the work. Revisit if v1 ships well and post-launch content updates want to add deeper rarity mechanics.

### 11.5 Visual differentiation

Two visual treatments per rarity:

1. **Color-tinted rarity label** ("Common", "Uncommon", "Rare", "Legendary") in the rarity color. Explicit read — player knows exactly what tier they got.
2. **Colored border on the weapon icon card** in the rarity color. Instant visual signal before the player reads the label — same pattern used by Diablo, Borderlands, and most ARPGs. Implemented as `borderWidth` + `borderColor` style props on the existing `<View>` card in `CrateRevealModal`. No Skia, no canvas work required.

Both treatments appear in:
- Crate reveal modal (when weapon is revealed)
- HUD weapon icon strip (when weapon is equipped — Phase 7)
- Flea market purchase screen (Phase 10) if/when weapons appear there with rarity

### 11.6 Inventory interaction with rarity

Phase 7's weapon inventory design specifies "if EQUIPing a weapon you already own, switch active without adding a duplicate." Rarity adds one rule:

- **If rolled rarity > owned rarity for the same weapon type:** replace the owned copy with the new higher-tier version.
- **If rolled rarity ≤ owned rarity for the same weapon type:** discard the new copy. Optionally convert to score or money pickup (design choice for Phase 7+).

Player never has two of the same weapon at different tiers. Always the best version they've found.

### 11.7 Skills are NOT affected

Rarity is a weapons-only mechanic. Skills retain their existing stacking-based progression (1-5 stacks per skill). Adding rarity to skills would dilute both systems — different progression mechanics for different entity types is the right separation.

The existing skill clones design (Section 7 of this document) remains unchanged. Clones differ by percentage adjustments on the same engine field. No rarity tiers on clones either.

### 11.8 Implementation scope estimate

Roughly half a phase of work. Smaller than Phase 4c (crate weapons). Engine already supports stat profiles; rarity is additive.

Work required:
- Rarity tier data definitions (data/rarities.ts or extend data/weapons.ts)
- Crate roll logic: pick weapon + pick rarity weighted by table
- Weapon equip logic: handle rarity comparison on duplicate
- Visual: glow effect on weapon icons (CrateRevealModal, HUD)
- Visual: color-tinted text (existing pattern, extend to crate reveal)
- Tuning pass: drop rate weights against actual Phase 5+ playtests

### 11.9 Open questions deferred to implementation phase

1. **What happens to a discarded duplicate?** Silent discard, convert to score, convert to flea-market currency? Phase 10 if currency exists.
2. **Does the flea market sell weapons with selectable rarity, or fixed at Common only?** Selectable rarity adds another monetization hook but complicates the flea market UI. Defer to Phase 10 planning.
3. **Do rarity tiers also apply to the starter Pistol?** Probably not — starter is fixed Common. Tested against playtest feel.
4. **Are quest payouts tied to rarity tier kills?** "Kill 10 enemies with a Legendary weapon" type quests. Possible Phase 10 quest template extension; not in initial 28-template pool.

### 11.10 Origin

Concept emerged during a brainstorm session 2026-05-12 after Mo played the game post-Phase 4c and noted: "If they get a shotgun, they may never care about a crate again. But if they have a rare shotgun (blue), they may want to hit more crates to hold out for a legendary (gold)." This is a player-felt design gap, identified through actual playtesting, not theoretical design. That makes it high-confidence for inclusion. One commit, doc-only. Commit message: "Strategy doc: add weapon rarity tier design (Section 11), graduated from brainstorm session."

---

## 12. What this document is NOT

- A commitment to build any of this. The design is reasoned and locked, but Phases 9/10 are far from current development.
- A pricing study. Numbers here are placeholders for design conversation, not market-tested values.
- An authoritative F2P design. Genuine F2P design expertise is outside the design conversations this doc captures. Worth consulting a specialist before final pricing/balancing decisions are made.
