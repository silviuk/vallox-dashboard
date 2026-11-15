# Changelog

## 1.2.8

- Remove the overview heading badge for the unit status sensor. vallox2mqtt sets its icon to `mdi:air-conditioner`, and Home Assistant rendered that badge as "A/C" at the top right of the graphic dashboard. This is a ventilation unit, not an air conditioner. The outdoor temperature and service-needed badges are unchanged. The classic tiles heading is unchanged.
- Preserve the 1.2.7 look and behaviour: dark-mode filter contrast, animation option, active buttons, 1.2.1 flat artwork, neutral gray surfaces, 600 px wide-layout cap, full-width stacked phone cards and the ValloPlus exchanger shape.

## 1.2.7

- Raise the contrast of the F7 and G3 filter labels, duct numbers and filter pleats in dark mode so the labels meet WCAG AA against the card background in the default Home Assistant dark theme and with the dark fallback colours. The light-mode look is unchanged.
- On a dark card background, those labels use `--primary-text-color` and the pleats use `--secondary-text-color`, with neutral gray fallbacks; light-mode colours stay on the existing muted and divider theme variables.
- Preserve the 1.2.6 behaviour and look: animation option, active buttons, 1.2.1 flat artwork, neutral gray surfaces, 600 px wide-layout cap, full-width stacked phone cards and the ValloPlus exchanger shape.

## 1.2.6

- Keep the airflow and fan animation playing by default, but respect `prefers-reduced-motion` (Windows "Animation effects" / "Animate controls and elements inside windows" off, Android "Remove animations", and similar settings). While motion is off, static arrowheads still show the flow direction.
- Add graphic option `animation: auto|on|off` (default `auto`) so the subtle motion can be forced on or off. `on` overrides reduced motion.
- Show the controller Boost, Heating and Shower buttons in a flat 1.2.1 on-state (soft accent fill, `aria-pressed`) when that mode is active: built-in boost switch or remaining time, climate `heat`, and the shower package helper or timer.
- Preserve the 1.2.5 layout and look: 1.2.1 flat artwork, neutral gray fallbacks, 600 px wide-layout cap, full-width stacked phone cards and the ValloPlus exchanger shape.

## 1.2.5

- Cap graphic cards at the designed 600 px drawing width and centre them on wider tablet and laptop layouts, so the complete airflow and fan animation stays visible. Phone cards still fill their column.
- Preserve the 1.2.4 look: 1.2.1 flat artwork, neutral gray fallbacks, full-width stacked phone cards and the ValloPlus exchanger shape.

## 1.2.4

- Replace teal-tinted graphic surface, border and text fallbacks with theme-derived neutral grays; use neutral light/dark palettes in the offline preview.
- Preserve the 1.2.3 layout, artwork, airflow colours, amber status lights and focus accent.
- Add a neutral graphic palette regression check and refresh all five offline screenshots.

## 1.2.3

- Restore the 1.2.1 look and colours for both drawings by user request, keeping the 1.2.2 full-width sizing and upright exchanger structure.
- Give exchanger fans filled circular backgrounds, move the bypass label clear of the casing edge, and tidy the open bypass route with one right-angle crossing and no recovery badge overlap.
- Refresh graphic documentation, offline preview version, five screenshots and regression checks.

## 1.2.2

- Fix phone sections layout: stack full-width graphics with automatic rows; widen the remaining switch-function tile. Use proportional SVG sizing and view-specific masonry estimates.
- Redraw the original controller with a depth bezel, recessed LCD and pill buttons; add an upright Modell R exchanger casing, numbered round ducts, tall cell, fan housings and pleated F7/G3 filters.
- Make the offline phone harness apply strategy grid options, including following tile/group spacing; refresh EN/DE light/dark captures and layout/structure regression tests.
- Preserve options, actions, keyboard access, reduced motion and default/tiles snapshots.

## 1.2.1

- Draw two full crossing heat-exchanger bands inside one outlined cell, with subtle plates and warm/cold gradients; place recovery beside the cell and heater labels beside their symbols.
- Compact both graphics to equal desktop heights with balanced bottom padding; place fan controls beside the readout and keep three short action buttons in one row on mobile without a repeated boost footer.
- Hide exchanger fan/boost badges beside the strategy controller; show them inside standalone exchangers via `show_status` (default `true`).
- Refresh offline light/dark desktop/mobile captures and verify German spacing, accessibility and unchanged default/tiles snapshots.

## 1.2.0

- Add opt-in `style: graphic` to section/view/dashboard strategies, preserving default and tiles output from 1.1.0.
- Bundle one standalone `custom:vallox-graphic-card` with original MIT controller and heat-exchanger SVG views, theme support and English/German labels.
- Add user-activated fan-level, boost, heating and optional shower controls, guarded by advertised modes and current states; power stays read-only.
- Animate directional air streams and motor fans with reduced-motion support; show live temperatures, guarded recovery, heaters, bypass, boost and alarms.
- Retain existing nonduplicated groups and core fan/profile controls; support discovery, manual role overrides and graphic visibility switches.
- Add saved 1.1.0 regression outputs, offline renderer/action tests, a static local preview harness and light/dark Chrome screenshots.
- Bump resource/package and generated tiles examples to 1.2.0.

## 1.1.0

- Discover vallox2mqtt 1.2 alarms, built-in boost time remaining and read-only unit setpoints, excluding raw diagnostics.
- Add a conditional alarm banner and a temperature flow strip with measured or estimated heat recovery.
- Add optional shower boost preset buttons and active countdown/cancel, plus optional humidity boost helper tiles.
- Add per-group `show` options, configurable `shower_boost_presets` and entity-role overrides for all package helpers.
- Ship an optional HA 2025.1+ shower/humidity package with restore, extension, external-change abort, restart cleanup and cooldown behavior.
- Keep shower boost ownership and its restore timer when fan-level confirmation times out; allow up to 60 seconds for confirmation.
- Restore the auto humidity enable toggle across restarts (off on first creation); numeric humidity defaults still reset on restart.
- Add English/German labels, installation/configuration documentation, a sanitized 1.2 fixture and regenerated MQTT example.
- Preserve the original output for older units by default; fix test/tool file paths on Windows and expand offline regression checks.

## 1.0.0

- Initial HACS plugin with section, view and dashboard strategies for vallox2mqtt and core Vallox.
- Built-in fan/profile controls, temperature and heat recovery cards, status/service tiles and history graphs.
- English/German labels, entity overrides and explicit YAML examples.
