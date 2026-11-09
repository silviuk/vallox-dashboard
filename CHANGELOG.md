# Changelog

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
