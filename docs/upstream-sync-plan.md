# Plan: Sync fork with upstream Mobile-Telematics, then re-apply approved customizations

## Context

The opendriven fork of `Mobile-Telematics/telematicsSDK-demoapp-react` is materially diverged from upstream. The user wants to:

1. Reset to the latest upstream release. **`upstream/main` is already at v2.0.1** (commit `fddb3d3`, dated 2026-04-01); the `2.0.1` annotated tag points at the same commit. There is no separate "tag vs main" distinction to worry about.
2. Re-apply only the customizations that are genuinely fork-unique, after the user reviews and approves the list.
3. Commit everything to the **current branch `20260428_MOB-449_TelematicsUpdate`** but **never push** — final state is local-only, awaiting user review.

## Baseline correction

Earlier exploration leaned on `1.0.8.1` as the fork's main; that branch is a stale 2024 release line. The correct baseline is `origin/main` (tip `dfdca0d`).

| Ref | Tip | Notes |
|---|---|---|
| `origin/main` | `dfdca0d` | Real fork main; current MOB-449 branch is at this commit (0 ahead) |
| `upstream/main` | `fddb3d3` | Upstream **v2.0.1** (annotated tag `2.0.1` points here) |
| Merge-base (origin/main ↔ upstream/main) | `749d8c0` | 2024-10-28 |
| Fork-unique non-merge commits | **45** | Plus 19 fork-side merges that collapse during reset |
| Upstream commits we'd pull in | **25 non-merge** (29 with merges) | New listeners, RN 0.81.4, Android SDK 3.3.0, iOS SDK 7.0.3, restructured API, Xcode 26.4 fix |
| Files diverged | 66 | Heavy: `src/index.tsx` (~334 lines), `yarn.lock` (~3,345 lines), `package.json`, podspecs, `ios/TelematicsSdk.swift`, Android module |
| Diff size | ~15,531 insertions / ~10,587 deletions | |

## User decisions (already captured)

- **Strategy:** Recreate sync from scratch (do NOT reuse the existing `sync/upstream-v2.0.0` branch — it was based on v2.0.0 not v2.0.1, and was missing Task 5).
- **Android `isAdOn` default:** `true` (accident detection ON).
- **Working branch:** Stay on `20260428_MOB-449_TelematicsUpdate`; rewrite its history.
- **Push policy:** Local commits only. The user will push after reviewing.

## Customizations inventory (this is the list the user must approve)

Every fork-unique commit on `origin/main` (vs `upstream/main`), classified. **Recommendation column** is what I propose; user can override per row before Phase 3 begins.

### Category A — Superseded by upstream (skip)
These were the fork's incremental attempts to track the SDK / RN. Upstream has now done all of them its own way; porting them would just create conflict noise.

| Hash | Subject | Why skip |
|---|---|---|
| `7a97af1` | chore: update rn 0.81 | Upstream `71eb3b4` bumps RN to 0.81.4 |
| `ba130ea` | chore: bump telematicssdk to 3.2.0 | Upstream `34b41b4` adds Android 3.2.0 + iOS 7.0.3; `4251ea3` further bumps Android to **3.3.0** |
| `4ff858d` | feat: added onLocationChanged event | Upstream `54c3cfa` adds location/tracking-state listeners |
| `61b09ae` | fix: added listener support | Same |
| `f360566` | fix: Telematics 3.0.1 working with android, iOS TODO | Superseded by 3.3.0/7.0.3 work |
| `4277f88` | fix: Update to TelematicsSDK | Superseded |
| `dfe1af6` / `4a33289` | updated RaxelPulse to 6.0.5 | Superseded by 7.0.3 |
| `4cad044` | fix: resolve for startPersistentTracking | Upstream `fec3fbc` adds startpersistenttracking with refactor |
| `a2c7257` | feature: startpersistenttracking | Same |
| `c0135bd` `02ca2c6` `48e9123` `2f4c2e6` | Update TelematicsSdk.swift (multiple) | TelematicsSdk.swift is rewritten upstream; old patches no longer apply |
| `2f90698` `542334d` `d5b7b71` `9d67f48` `50d1c02` `68ae360` | Update TelematicsSdkModule.java (multiple) | Same — module rewritten upstream |
| `0a9f354` `052cb21` `00456a8` `00d7dd6` `a12bb10` `b3ce559` `d79b71e` | Update package.json / version bumps | Versioning gets re-decided in Phase 3 |
| `e69edca` | tsconfig importsNotUsedAsValues → verbatimModuleSyntax | Upstream tsconfig is its own; adopt as-is |
| `cb28185` `e9320b9` `9213f74` `8b25074` | "update" / "fixed android" / "fixed ts erorr" / "ios working" | Vague; superseded by upstream rewrite |
| `6a7a279` `c44b1a9` `9d7602f` `f1d966d` `16973b7` | npm i / pod install / build files | Lockfile churn; will be regenerated |
| `20585c9` | Revert Update TagsStateDelegate.swift | `TagsStateDelegate.swift` is **removed** in upstream — moot |

### Category B — Genuinely fork-unique, must port
The actual EverDriven differentiators.

| # | Source commit | Customization | Files |
|---|---|---|---|
| B1 | `59c5435` | `areAllRequiredPermissionsGranted()` — non-blocking permission check returning `Promise<boolean>` | `src/index.tsx`, `ios/TelematicsSdk.swift`, `ios/TelematicsSdk.m`, `android/src/main/java/com/reactnativetelematicssdk/TelematicsSdkModule.java`, `example/src/App.tsx` |
| B2 | `d4060b4` | Android `Settings.isElmOn = false` (disable Bluetooth/ELM327 permission ask) | `android/src/main/java/com/reactnativetelematicssdk/TelematicsSdkModule.java` |
| B3 | `d6f3bec` | Android `Settings.isAdOn = true` (accident detection ON by default) — **user confirmed `true`** | Same |

### Category C — Investigate first, port if upstream still has the bug
These look like real bug fixes but the underlying code paths were heavily rewritten upstream. At implementation time, read the upstream code at `upstream/main`, decide whether the bug still exists, and only port if it does.

| Hash | Subject | What to check |
|---|---|---|
| `94590a3` | fix: collection mutation issue for disable() | Inspect `ios/TelematicsSdk.swift` `disable()` on `upstream/main` — does it still mutate while iterating? |
| `a94d528` | fix: implemented removeFutureTrackTag with new param | Compare upstream `removeFutureTrackTag` signature with what callers expect |
| `7d57cd6` | fix android requestPermissions not returning promise result | Check upstream Java `requestPermissions` resolves its `Promise` |
| `0056753` | fix: unresolved promises | Sweep TelematicsSdk.swift / TelematicsSdkModule.java for any `@ReactMethod` / `@objc` that doesn't resolve/reject |

### Category D — Out of scope (informational only)
- Merge commits (`451e896`, `4d48a92`, etc.) — collapse into rewritten history.
- Branch-of-branch noise (`56a0bc4`, `41e82e8`, etc.) — same.

---

## Implementation phases

### Phase 0 — Confirm baseline
```bash
git fetch upstream --tags          # safety; should be a no-op
git rev-parse upstream/main refs/tags/2.0.1   # both should print fddb3d3...
```
If those don't match, stop and reconcile before continuing — the rest of the plan assumes `upstream/main == v2.0.1`.

### Phase 1 — Commit the inventory document for approval (STOP HERE)
Create `docs/superpowers/specs/2026-04-28-fork-customizations-inventory.md` with the inventory above (Categories A/B/C/D, one row per fork commit, recommendations).
- Run `npx eslint . --fix` per global pre-commit rule.
- Commit on `20260428_MOB-449_TelematicsUpdate` using `mob-commit` style: `docs(MOB-449): add fork customizations inventory for upstream sync`.
- **Stop and ask the user to review.** Do not proceed to Phase 2 until they confirm row-level decisions (especially Category C).

### Phase 2 — Reset working branch to upstream/main (= v2.0.1)
After user approves the inventory:
```bash
git tag archive/MOB-449-pre-sync 20260428_MOB-449_TelematicsUpdate    # safety net
git reset --hard upstream/main                                        # rewrites local history; equivalent to refs/tags/2.0.1
```
At this point the inventory commit from Phase 1 is gone from the branch. **Cherry-pick it back** so the doc travels with the synced branch:
```bash
git cherry-pick archive/MOB-449-pre-sync   # the inventory commit
```

### Phase 3 — Re-apply approved customizations
One commit per Category B item, plus any Category C items the user opted in. Each commit follows `mob-commit` format: `feat(MOB-449): <description>` or `fix(MOB-449): ...`.

**B1 — `areAllRequiredPermissionsGranted()`** (4 files, ~1 commit or split TS/iOS/Android):
- `src/index.tsx`: add `areAllRequiredPermissionsGranted: () => Promise<boolean>` to the SDK type/interface, sibling to the existing `isAllRequiredPermissionsAndSensorsGranted`.
- `ios/TelematicsSdk.swift`: add `@objc(areAllRequiredPermissionsGranted:rejecter:)` resolving `RPEntry.instance.isAllRequiredPermissionsGranted()` (verify the iOS SDK 7.0.3 method name; fall back to `RPPermissionsWizard.returnInstance().isAllRequiredPermissionsGranted()` if needed).
- `ios/TelematicsSdk.m`: `RCT_EXTERN_METHOD(areAllRequiredPermissionsGranted: (RCTPromiseResolveBlock)resolve rejecter: (RCTPromiseRejectBlock)reject)`.
- `android/.../TelematicsSdkModule.java`: `@ReactMethod public void areAllRequiredPermissionsGranted(Promise promise) { promise.resolve(api.areAllRequiredPermissionsGranted()); }`.
- `example/src/App.tsx`: add a "Check Permissions Status" button using upstream's new `Button` / `showInfoAlert` helpers (do **not** copy the old fork pattern — the example app is fully rewritten upstream).

**B2 + B3 — Android Settings defaults** (1 commit):
- `android/.../TelematicsSdkModule.java`: locate the `Settings(...)` constructor call (upstream may have moved it). Apply `isElmOn = false`, `isAdOn = true`. If upstream now uses a different config mechanism (no Settings ctor), adapt — the goal is the *behavior*, not the syntax.

**Category C** (only items user opts in; one commit each).

### Phase 4 — Verify
Run, in order, fixing failures before moving on:
```bash
yarn install              # fresh node_modules from upstream lockfile
yarn typescript           # tsc --noEmit
yarn lint                 # eslint
yarn test                 # jest
cd example && yarn install && cd ios && pod install   # if user has Ruby/CocoaPods
```
Document any test gaps (e.g., no Jest coverage of new permissions method) but do not invent tests.

UI smoke test of the example app on a real device is **the user's call** — flag this in the final summary.

### Phase 5 — Stop
Final state:
- `20260428_MOB-449_TelematicsUpdate`: local-only, ahead of `origin/main` by `upstream/main` baseline + inventory + customizations.
- `archive/MOB-449-pre-sync`: tag pointing at the pre-reset state for emergency recovery.
- Tell the user the branch is ready; they push when satisfied.

## Critical files to modify

In Phase 1 (inventory): `docs/superpowers/specs/2026-04-28-fork-customizations-inventory.md` (new).

In Phase 3 (customizations):
- `src/index.tsx`
- `ios/TelematicsSdk.swift`
- `ios/TelematicsSdk.m`
- `android/src/main/java/com/reactnativetelematicssdk/TelematicsSdkModule.java`
- `example/src/App.tsx`

No other files should be touched. If any other diff appears it's an accident.

## Reusable patterns / functions

- Upstream's `isAllRequiredPermissionsAndSensorsGranted` is the structural twin of B1; mirror its signature in TS, Swift, ObjC bridge, and Java exactly (just swap the underlying SDK call).
- Upstream's `Button` component (`example/src/components/Button.tsx`) and `showInfoAlert`/`showErrorAlert` helpers are already in the rewritten example app — reuse them in B1's UI button rather than copying the old fork's UI patterns.
- The prior session's spec (`main_20260428_docs_upstream-sync-plan` branch, file `docs/superpowers/specs/2026-03-21-upstream-sync-design.md`) has reference snippets for B1's per-platform implementation. Useful as a sanity check; not authoritative since it targeted v2.0.0.

## Verification (end-to-end test)

1. After Phase 4, `git log --oneline upstream/main..HEAD` should show: 1 inventory doc commit + ≤4 customization commits (B1, B2+B3 combined, optional C items).
2. `git diff --stat upstream/main..HEAD` should touch only the files listed above. Any extra file = bug.
3. `yarn typescript && yarn lint && yarn test` all green.
4. (Manual) Build example app on iOS + Android, tap "Check Permissions Status" before granting any perms → expect `false`; grant perms → expect `true`. Confirm Android does *not* prompt for Bluetooth (isElmOn=false) and that accident detection is active (isAdOn=true).

## Out of scope

- Pushing to `origin` (explicitly excluded).
- Publishing to npm.
- Merging into `1.0.8.1` (the stale legacy branch).
- Touching `sync/upstream-v2.0.0` or `main_20260428_docs_upstream-sync-plan` branches — leave them as historical artifacts.
- Porting any Category A item.
- Creating tests for B1/B2/B3 unless upstream already has a Jest harness for similar methods.

## Push policy

**Never** run `git push` during this work. The plan ends at Phase 5 with local commits only, awaiting user review.
