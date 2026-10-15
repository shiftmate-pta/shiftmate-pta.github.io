# ShiftMate LIVE 3.1.12 PAY CALCULATIONS

Promotes the tested pay-calculation scope from TEST main (9071764) to LIVE, based on LIVE 797a1f7. LIVE is `shiftmate-pta/shiftmate-pta.github.io`, deployed by GitHub Pages from `main` at the repository root, URL https://shiftmate-pta.github.io/.

## Included

- Classification-specific annual leave loading from 23 August 2026, precise hourly percentages and daily payment-line rounding, 2026 cap and optional cap history. Missing history and unsupported future caps remain disclosed.
- Full-time-only entitlement calculations, ignoring legacy saved employment fraction and part-time average hours while retaining individual leave-day hours.
- Applicable rostered holiday hours during paid leave, without annual loading or annual-leave usage; qualifying genuinely non-rostered days retain eight hours.
- The specific payroll-confirmed provisional 54.3 km Burswood/Armadale-home to Ellenbrook station return route; other routes and official distances are retained. Separate transfer, home-line and cost-neutral rules are retained.
- Collapsed Advanced leave-loading settings, precise calculation/deduction audit, route provenance and explicit unverified mileage-withholding labelling.

## Preserved

The manifest file, name, start URL, scope, icon identity, agreement data and storage module are unchanged. The existing `ptaV2Current` and `ptaV2Cycles` storage keys remain. No data reset, storage migration, installation-identity change, unregister or reinstall is performed. Existing app configuration, PDF generation, scanner and roster-projection features were not imported from TEST or replaced.

Only reviewed pay-related app/index hunks were transferred; TEST app/index files were not copied wholesale. The inspected calculator and supporting loading module were promoted alongside anonymous component tests. No private payslips, screenshots, signatures or source MOU are published.

The service-worker URL remains `./service-worker.js`. Its cache and changed asset URLs advance to `3.1.12-pay-calculations`, with exact versioned shell URLs precached. Existing same-origin home-screen installations can update in place online, keeping local data. Open online, close/reopen, and confirm Settings version 3.1.12 PAY CALCULATIONS; no delete/re-add or data-clearing step is needed.

## Validation

- MOU loading/date/classification/cap and full-time saved-data regressions.
- Both anonymous payslip component comparisons; PE031026 roster gross 4443.78, paid hours 80, annual leave usage 70. Retrospective 0.48 remains separate.
- Calculation regressions and 1033 cross-line / 137 same-line allowance combinations.
- Existing LIVE roster-projection alignment tests.
- Mobile-sized Chrome controls and offline reload.
- Same-origin upgrade from LIVE 797a1f7: install old service worker, seed current/saved data, switch to release, update/reload and verify offline. Manifest/scope/origin/worker identity, settings, entered roster, saved cycles, actual deposits and notes are preserved.
- Syntax and Git whitespace checks.

Tests: `node tests/annualLeaveLoading.test.js`, `node tests/payCalculator.test.js`, `node tests/offlineAllowanceCoverage.test.js`, `node tests/rosterProjection.test.js`, `node tests/annualLeaveLoading.browser.test.cjs`, `node tests/liveReleaseUpgrade.browser.test.cjs`. Browser tests need Chrome and PLAYWRIGHT_MODULE set to an available Playwright package. Upgrade test requires repository history containing the prior release.

## Known limits retained

The annualised withholding formula and existing mileage exclusion from withholding are unchanged. Their exact payroll treatment remains unverified. A previous mixed-fortnight comparison retains approximately 0.29 of minute-versus-payroll earnings difference; no bank-deposit match is forced. Complete cumulative loading history and later caps/replacement MOU tables are still needed where applicable. Browser checks simulate mobile dimensions; they do not claim a physical iPhone/WebKit acceptance test.
