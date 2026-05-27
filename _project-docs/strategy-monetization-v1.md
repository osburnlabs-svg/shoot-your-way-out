# Strategy: Monetization Design v1

**Status:** Active strategic design. Sections 1–2, 4–12 are current. Section 3 (quest system) is deferred — not v1. Sections 13–14 document formal v1 scope cuts locked May 13 2026. All currency amounts are placeholders to be re-tuned during Phase 9/10 against actual gameplay data from a Phase 5+ build.

---

## 1. Core philosophy

- **Minimal monetization that respects player time.** No intrusive ads, no banner ads, no forced interstitials.
- **Two payment paths for the same effect.** Where possible, give players a choice: watch an ad OR spend earned currency. Same outcome, different cost.
- **Gameplay-mechanic monetization over cosmetic.** Skins and weapon variants don't read visually in a top-down survivor game (player only sees arms and head). Meta-game features are the right hook.
- **Free players retain meaningful gameplay.** The flea market is not paywalled. Free players earn slowly through in-run currency drops and a daily login bonus; paid players receive a larger daily bonus.

---

## 2. What's locked from existing context

These came into the strategy from the v3 context doc, unchanged:

- No intrusive ads of any kind
- One ad per run, player-initiated, for revive (Phase 4b G3 already implements the stub button)
- Optional pre-run buff ad — player watches an ad before a run to start with one random skill applied

---

## 3. Paywalled quest system — DEFERRED, NOT V1 (locked May 13 2026)

> **Status update May 13 2026:** The daily quest system is removed from v1 scope. Its economic function — giving paid players accelerated currency accumulation — is replaced by the simpler daily login bonus (see Section 5.2). The quest design below is preserved in case it ships in v1.1 or later, but **no implementation is planned for launch**. The IAP paywall concept is restructured: the paywall no longer gates quest access, it gates the daily login bonus amount (free: $50/day; paid: $300/day). See Section 6 for the updated free vs. paid comparison.

---

*Original quest system design — reference only, not scheduled:*

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

A pre-run shop where players spend earned currency to start a run with one bonus skill applied.

- **Skills only** — no weapons, cosmetics, or consumables in v1. Defer to post-launch content updates.
- **Price-gated only.** No Operator License gate — all players access the flea market. Paid players accumulate currency faster via the daily login bonus multiplier.
- **Purchased skills apply to next raid only.** Not permanent meta-progression. Cleared after raid start.

Separate pre-run ad path (unchanged): watch an ad → start with 1 random skill at 1 stack. Flea market adds the ability to *choose which* skill by spending currency.

### 4.2 Flea market inventory (Phase 8 decisions locked 2026-05-25)

**Skills (15 of 24 available per day):**
- 15 of the 24-skill pool are available each day, rotating daily.
- Layout: 5 rows × 3 columns grid.
- Daily inventory seeded by device-local date (YYYY-MM-DD). Pure deterministic function — same 15 skills for all players on the same calendar day. Computed live on flea market open to handle midnight rollover during play.
- Selecting a skill applies 1 stack of that skill when the next run starts.

**Per-skill pricing (locked 2026-05-26, re-tune Phase 10 against live player data):**

| Tier | Price | Skills |
|---|---|---|
| Premium | $5,000 | Plate Carrier, Heavy Plate, Helmet, Backpack, Field Medic Kit, Frag Grenade, Hollow Points |
| Standard | $3,000 | Armor-Piercing Rounds, Holographic, Ceramic Insert, MRE, Energy Bar, Tactical Boots, Painkillers, Smoke Grenade, Molotov |
| Cheap | $2,000 | Red Dot, ACOG, Suppressor, FMJ Ammo, Subsonic Rounds, Tracer Rounds, Knee Pads, Stims, Comms Headset |

Distribution: 7 premium / 9 standard / 9 cheap = 25 total. Prices tuned 2026-05-26 against Phase 7 earn-rate data; remain subject to Phase 10 re-tuning against live player data.

### 4.3 Flea market UI

- Reuses existing skill card art — no new visual work needed
- 5×3 grid of available skills for the day, each card showing skill name, icon, currency price, and BUY button
- **Per-raid purchase gate:** Limited to 1 flea market purchase per raid. Purchase state held as `pendingPurchasedSkill: skillId | null` on persistent player data. When non-null, all BUY buttons are disabled and the purchased card shows a "PURCHASED" overlay. Slot survives app sessions (AsyncStorage, same pattern as money). Consumed and cleared on Deploy when the raid starts.
- **WATCH AD button:** Lives inside the flea market screen alongside the purchased skill slot. Tapping grants a random skill from the 24-skill pool immediately (Phase 8: stubbed — no actual ad video; real AdMob integration is Phase 9). Note: Field Medic Kit excluded from this pool — on-select heal is a no-op at run start. Per-raid gate via `pendingAdSkill: skillId | null`. When non-null, button is disabled and label reads "AD WATCHED." Same persistence behavior as `pendingPurchasedSkill` — survives app sessions, consumed on Deploy.
- **Max 2 starter skills per raid:** 1 from ad (random) + 1 from flea market (chosen). On Deploy: apply both pending slots if non-null, clear both, raid starts.
- All players access without paywall

### 4.4 Edge case: duplicate skill

If a player buys a skill that later appears in a level-up draw, it can stack normally (stacking is the existing skill mechanic). No special handling needed — the starter skill is simply 1 stack applied at run start, same as all other skill applications. The same rule applies when the ad-granted skill matches the flea market purchase: they stack normally.

### 4.5 Persistence and consumption rules

- **No refunds.** Money spent on a purchase stays spent, even if the player never deploys.
- **No re-rolls.** Once `pendingAdSkill` is set, the player cannot re-watch to get a different random skill while holding a pending ad skill.
- **Consumed on Deploy.** Both `pendingPurchasedSkill` and `pendingAdSkill` are applied and cleared when the player taps Deploy. If a slot is null, it is silently skipped.
- Matches the existing anti-cheese philosophy (device-local date, accept the cheese) — no server enforcement, minimal edge-case complexity.

---

## 5. Currency economy

### 5.1 Currency source

In-run money pickups drop from kills. Each pickup grants both XP (existing behavior) **and** flea-market currency (new). No split — both effects from one pickup.

**Currency rate (placeholder):** ~$1 per Scav kill, scaled up per enemy tier. Roughly $50 per run at the current Phase 4 baseline of 50 kills/run.

This number re-tunes during Phase 9/10 against actual Phase 5+ run length and enemy density. The shape is:

- Free player average run: ~50-150 in-run currency + $1,000 daily login bonus (on first run each calendar day)
- Paid player average run: ~50-150 in-run currency + $5,000 daily login bonus (on first run each calendar day)
- A cheap skill costs roughly 2 free daily cycles (cheapest tier $2,000 vs $1,000/day free bonus); paid players accumulate at 5× rate

### 5.2 Daily Login Bonus

All players receive a flea-market currency stipend on first login each calendar day (device-local time — same exploit-tolerance accepted for the original quest rotation design).

- **Free players:** $1,000/day (rough-tuned 2026-05-25 against Phase 7 earn-rate data; verify against flea market item pricing in Phase 10)
- **Paid players (one-time IAP):** $5,000/day (rough-tuned 2026-05-25; verify against flea market item pricing in Phase 10)

**Design rules:**
- No streak mechanics, no calendar bonuses, no escalating rewards. Keep it minimal for v1.
- v1.1+ may add streak counters if retention data supports it.
- Implementation: persistent `last_claim_date` field (ISO date string) on player data. On app launch, compare device date to `last_claim_date`. If a new calendar day, grant bonus and update the field. Single function, no server required.
- The 5× paid/free multiplier is the paywall's economic expression. Paid players fill the flea market significantly faster — enough to feel meaningfully different, not so extreme it trivializes the free grind.

### 5.3 Currency persistence

`flea_currency: number` on persistent player data. Survives between runs, never resets. Shipped Phase 7 (commit a452ab8) — `getMoney()` and `addMoney(amount)` in `src/lib/persistence.ts`, key `syo_flea_currency`. `last_claim_date: string` stores the last day the login bonus was claimed (ISO date, device-local) — added in Phase 8 alongside daily bonus implementation.

### 5.4 Balance philosophy

- Free play feels rewarding (you ARE earning, just slowly)
- Paid play feels accelerated (the 6× daily bonus means paid players can buy something from the flea market noticeably faster)
- The gap is the conversion incentive — players who enjoy the game eventually want to progress faster, which is what the paywall sells

---

## 6. Free vs paid player experience

| Feature | Free | Paid |
|---|---|---|
| Full gameplay (all skills, weapons, modes) | ✓ | ✓ |
| Revive ad on death | ✓ | ✓ |
| Pre-run buff ad (random skill) | ✓ | ✓ |
| Flea market (currency-based) | ✓ | ✓ |
| In-run currency drops | ✓ | ✓ |
| Daily login bonus | $1,000/day | $5,000/day |
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

**Phase 8 — Flea market + daily login bonus**

- Flea market UI screen (5×3 grid, 15-of-24 daily rotation, device-local date seed)
- Pre-run starter skill state on persistent player data
- Daily login bonus logic: check `last_claim_date` on app launch, grant $1,000 (free) or $5,000 (paid) if a new calendar day, update `last_claim_date`
- Paywall gate on login bonus amount (free: $1,000/day; paid: $5,000/day)
- IAP stub: Operator License stubbed as hardcoded toggle for Phase 8 testing
- Pre-run ad stub: WATCH AD button inside flea market screen. Phase 8: tap immediately grants a random skill from the 24-skill pool (no actual ad video). `pendingAdSkill: skillId | null` on persistent player data. Real AdMob integration is Phase 9.
- Balance pass: tune currency drop rate, login bonus amounts, and item prices against actual Phase 7+ gameplay data

**Phase 9 — Monetization foundation + ship prep**

- Real IAP integration (Apple/Google sandbox + receipt validation). Replaces Phase 8 stub.
- AdMob rewarded ad SDK integration (replaces revive-ad and pre-run-buff-ad stubs)
- License verification and entitlement caching
- `last_claim_date: string` field on persistent player data (ISO date string, device-local) — added alongside Phase 8 daily bonus logic

**Estimated build size:** Phase 9 (monetization + ship prep) is largely unchanged from original scope. Phase 8 (flea market + daily bonus) is roughly 30% of the original quest-heavy scope — no quest definitions file, no quest tracking counters in the engine, no per-quest UI screens. The daily login bonus replaces the entire quest system with a single timestamp check on app launch.

---

## 9. Open questions deferred to Phase 9/10 planning

1. **Specific IAP price.** $4.99 vs $9.99 — decide closer to launch with player data and price sensitivity research.
2. **In-run currency drop rate.** Current $1/Scav is a placeholder. Tune against actual Phase 5+ run length and enemy density.
3. **Free player retention strategy.** If free players churn at "I can't afford things," reconsider whether the daily login bonus needs to be higher or currency drop rates more generous.

---

## 10. Future framing: subscription layer (v1.x, not v1)

**Tier 1 Operator Status** — conceptual monthly subscription that activates premium status on top of the permanent Operator License. License is permanent (one-time purchase, keeps daily $5K bonus forever). Active Operator Status is recurring (monthly, activates an additional tier of benefit TBD). Not in Phase 8 or Phase 9 scope. Preserving framing for post-launch planning.

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

v1 ships one visual treatment per rarity:

1. **Color-tinted rarity label** ("Common", "Uncommon", "Rare", "Legendary") in the rarity color. Explicit read — player knows exactly what tier they got. Shipped Phase 5.5 Session 6 (commit 6fff044; border removed 4c43cba).

A **colored border on the weapon icon card** was implemented and device-tested (commit 4c43cba) but removed — the border competed visually with the tier label and the label alone read more cleanly. Glow or background shade treatment is a Phase 6 polish candidate.

The tier label appears in:
- Crate reveal modal (when weapon is revealed) — shipped v1
- HUD weapon icon strip (when weapon is equipped — Phase 7)
- Flea market purchase screen (Phase 10) if/when weapons appear there with rarity

### 11.6 Inventory interaction with rarity (revised 2026-05-19)

Rarity is informational, not gatekeeping. The crate reveal modal shows rarity color and tier label so the player can make an informed Equip/Scrap decision. The current single-weapon-equip model means every crate presents Equip or Scrap regardless of how the rolled rarity compares to the currently-equipped weapon's rarity.

The original auto-discard rule (auto-scrap duplicates of lower rarity) was scrapped on 2026-05-19 (Session 6) per design call: the player retains full agency. If they want to scrap a Legendary in favor of a Common variant of a different weapon type they prefer, that's their choice.

When Phase 7's weapon inventory ships, the existing "don't add duplicates" rule applies. Rarity remains informational at that point.

### 11.7 Skills are NOT affected

Rarity is a weapons-only mechanic. Skills retain their existing stacking-based progression (1-5 stacks per skill). Adding rarity to skills would dilute both systems — different progression mechanics for different entity types is the right separation.

The existing skill clones design (Section 7 of this document) remains unchanged. Clones differ by percentage adjustments on the same engine field. No rarity tiers on clones either.

### 11.8 Implementation scope estimate

Roughly half a phase of work. Smaller than Phase 4c (crate weapons). Engine already supports stat profiles; rarity is additive.

Work required:
- Rarity tier data definitions (data/rarities.ts or extend data/weapons.ts)
- Crate roll logic: pick weapon + pick rarity weighted by table
- Weapon equip logic: handle rarity comparison on duplicate
- Visual: colored border on icon card in the rarity color (`borderWidth` + `borderColor` on the existing `<View>` card in `CrateRevealModal`; extend to HUD weapon strip in Phase 7)
- Visual: color-tinted text (existing pattern, extend to crate reveal)
- Tuning pass: drop rate weights against actual Phase 5+ playtests

### 11.9 Open questions deferred to implementation phase

1. **What happens to a discarded duplicate?** Silent discard, convert to score, convert to flea-market currency? Phase 10 if currency exists.
2. **Does the flea market sell weapons with selectable rarity, or fixed at Common only?** Selectable rarity adds another monetization hook but complicates the flea market UI. Defer to Phase 10 planning.
3. **Do rarity tiers also apply to the starter Pistol?** Probably not — starter is fixed Common. Tested against playtest feel.
4. **Are quest payouts tied to rarity tier kills?** "Kill 10 enemies with a Legendary weapon" type quests. Possible Phase 10 quest template extension; not in initial 28-template pool.

### 11.10 Origin

Concept emerged during a brainstorm session 2026-05-12 after Mo played the game post-Phase 4c and noted: "If they get a shotgun, they may never care about a crate again. But if they have a rare shotgun (blue), they may want to hit more crates to hold out for a legendary (gold)." This is a player-felt design gap, identified through actual playtesting, not theoretical design. That makes it high-confidence for inclusion.

---

## 12. What this document is NOT

- A commitment to build any of this. The design is reasoned and locked, but Phases 9/10 are far from current development.
- A pricing study. Numbers here are placeholders for design conversation, not market-tested values.
- An authoritative F2P design. Genuine F2P design expertise is outside the design conversations this doc captures. Worth consulting a specialist before final pricing/balancing decisions are made.

---

## 13. v1 Scope Cuts (locked, May 13 2026)

These features are formally cut from v1. Future sessions reading cold should treat these as out-of-scope unless a documented scope change reverses a decision.

### Cut from v1 — deferred to v1.1 or later

- **Daily quest system** — replaced with daily login bonus (Section 5.2). Simpler engine, same economic function. Quest design preserved in Section 3 for potential v1.1 revival.
- **Lightning flash + thunder SFX** — rain weather ships with rain particles and drifting clouds only. The visual/audio atmospheric pair is cut for launch simplicity. v1.1 candidate if retention data supports more atmospheric depth.
- **Helicopter boss with phased attacks** — replaced with ambient flyby (Section 14). Full boss fight mechanics, health phases, homing rockets, and enraged state are cut. Engineering cost drops from ~one full phase to ~one day of work.
- **Bomber strafe hazard event** — bomber repurposed as a static "crashed bomber" map prop (Section 14). No hazard mechanics, no damage, no ordnance drops.
- **Gas bomb hazard** — cut entirely. No replacement or deferral planned for v1.
- **Tank as mobile enemy class** — tanks ship as stationary turrets, not walking enemies (Section 14). Pathfinding and AI follow-behavior are cut; turret fire behavior reuses Sniper turret engine code.

### Confirmed for v1 (not cuts)

- Skill clones — 5 clones (Section 7) ship alongside the 20 base skills at launch.
- Weapon rarity tiers — Common/Uncommon/Rare/Legendary (Section 11) confirmed for v1.
- Flea market — unchanged (Section 4).
- Daily login bonus — new design replacing the quest system (Section 5.2).
- Custom UI — already the established pattern since Phase 4b; confirmed throughout.

---

## 14. Enemy and Hazard Scope Changes (locked, May 13 2026)

### Helicopter — ambient flyby (replaces The Hunter boss)

The helicopter boss with phased attacks, health pool, homing rockets, and enraged state is cut from v1. Replaced with a passive atmospheric element.

- **Single sprite** — `Helicopter_Base.png` or `BONUS Bomber Mini.png` (confirm which reads better at flyby altitude scale; decision at Phase 8 implementation).
- **Spawns on cadence** — every 60–90 seconds (placeholder; tune at Phase 8).
- **Straight-line flyover** — random entry/exit angle across the map. Does not target or react to the player.
- **Optional shadow** — a semi-transparent dark ellipse rendered slightly offset beneath the sprite as it passes. Approximately 1 hour of work. Adds visual depth without complexity.
- **No attacks, no health, no damage, no loot drop.** Pure atmosphere. Sells the warzone without requiring boss encounter engineering.
- **Engineering cost:** substantially lower than the original design. Likely fits within Phase 7 or folded into Phase 9 rather than requiring its own full phase.

### Tank — stationary turret (replaces mobile vehicle enemy class)

The Humvee/BTR/Panzer/ACS mobile vehicle roster is replaced with a single `TankTurret` entity class.

- **3 visual variants** — Humvee, BTR, and Panzer sprites used as visual variety. Engine treats all three identically (same stats, same AI, same collision profile). ACS cut from v1 — 3 variants is sufficient.
- **Spawns after ~2 minutes elapsed time** — spawns at a random position outside the player spawn zone, stationary at that coordinate for the rest of the run. Exact timing is Phase 5 balance work.
- **No pathfinding, no movement.** Fires at the player on a slow cadence (rate TBD at Phase 5 implementation).
- **Higher HP than foot soldiers** — designed to require sustained fire to kill.
- **Drops a guaranteed weapon crate on kill** — meaningful reward for the sustained engagement.
- **Engine code:** structurally identical to the Sniper turret. Extend the existing stationary-fire AI rather than building a new system.

### Bomber — static map prop (replaces strafe hazard)

The Bomber strafe hazard event is cut. The asset is repurposed.

- `BONUS Bomber Mini.png` becomes a "crashed bomber / downed aircraft" world prop.
- **0–1 per run** — same rare centerpiece budget as the bus wreck.
- **No hazard mechanics, no ordnance, no animations.** Visual set-dressing only — adds warzone atmosphere.
- Add to the `environmental-asset-audit.md` prop pool. Asset already exists in the kit — no sourcing work required.

### Gas Bomb — cut entirely

No replacement, no deferral. The 7-frame LightSmoke animation already used for smoke grenades and the Molotov zone covers all needed smoke visual work. Gas Bomb added no mechanic that wasn't already handled by those systems.
