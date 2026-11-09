# Vallox Dashboard for Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
[![Validate](https://github.com/silviuk/vallox-dashboard/actions/workflows/validate.yml/badge.svg)](https://github.com/silviuk/vallox-dashboard/actions/workflows/validate.yml)

A modern, tile-based Lovelace UI for **Vallox ventilation units** (MVHR / heat-recovery ventilation).
It ships as **section, view and dashboard strategies**: the UI builds itself from your entities, so there is
nothing to configure. It uses **only built-in Home Assistant cards**: tile, heading, button, history-graph and markdown.

Supported integrations (auto-discovered):

| Integration | Units | Notes |
|---|---|---|
| [vallox2mqtt](https://github.com/kotope/valloxesp) (ESP8266/ESP32 over RS485) | Vallox Digit SE, ValloPlus SE, and other RS485 models | climate fan modes 1–8, boost/fireplace switch, heating/motor status, service counter |
| [Vallox](https://www.home-assistant.io/integrations/vallox/) (Home Assistant core) | Vallox MV series (network) | fan with profiles, efficiency, fan RPMs, filter date, supply-air targets, bypass lock |

| Overview (mobile) | History (mobile) | Section (desktop column) |
|---|---|---|
| ![Overview](images/overview-mobile.png) | ![History](images/history-mobile.png) | ![Section](images/section-desktop.png) |

*The screenshots are from a real Vallox Digit SE running vallox2mqtt.*

## What you get

- **Controls:** fan speed (vallox2mqtt fan modes, or core profiles and fan speed), heating mode, and the boost/fireplace switch.
- **Air temperatures:** outdoor, supply, extract and exhaust, with colour-coded icons.
- **Heat recovery:** the unit's efficiency sensor (core) or, otherwise, a clearly labelled estimate:
  `(extract − exhaust) ÷ (extract − outdoor)`, shown only when the temperature difference is large enough.
- **Indoor air:** humidity and CO₂ when the unit has those sensors and they are enabled.
- **Status:** supply and extract fan, pre- and post-heating, summer mode, bypass, cell state.
- **Filter & service:** service counter or filter date, plus a warning banner when service is due.
- **History:** air temperatures (48 h), indoor air (24 h) and an activity timeline (24 h).
- **vallox2mqtt 1.2 extras:** alarm tiles and a live alarm banner (filter warning, error relay, cell freeze alarm or fault code > 0), built-in boost time left, and read-only unit setpoints. The raw defrost hysteresis diagnostic is excluded.
- **Temperature flow:** outdoor → supply, heat recovery, extract → exhaust, when all four temperatures exist. Defaults on for units with 1.2 extras; older units can opt in while keeping their original layout by default.
- **Optional shower boost:** configurable timed fan-level buttons, plus countdown and cancel while active, when the package entities exist.
- **Optional auto humidity boost:** enable toggle, humidity threshold/rise, fan level, duration and cooldown tiles, when those helpers exist.
- English and German labels, picked from your Home Assistant language.

Entities that don't exist or are disabled are skipped, so the UI never shows "Entity not found".

## Installation

### HACS (recommended)

1. HACS → ⋮ → **Custom repositories** → add `https://github.com/silviuk/vallox-dashboard`, type **Dashboard**.
2. Install **Vallox Dashboard** and reload the browser.
   HACS adds the resource `/hacsfiles/vallox-dashboard/vallox-dashboard.js` automatically.

### Manual

Copy `dist/vallox-dashboard.js` to `<config>/www/vallox-dashboard.js` and add a dashboard resource
(Settings → Dashboards → ⋮ → Resources) for `/local/vallox-dashboard.js`, type **JavaScript module**.

## Usage

### Section strategy

This adds the section to any existing sections view. Edit the dashboard, open the raw configuration editor, and add to `sections:`:

```yaml
- strategy:
    type: custom:vallox-ventilation
```

### View strategy

```yaml
views:
  - title: Ventilation
    path: ventilation
    icon: mdi:hvac
    strategy:
      type: custom:vallox-ventilation
```

### Dashboard strategy

Create a new dashboard ("New dashboard from scratch"), open the raw configuration editor and replace everything with:

```yaml
strategy:
  type: custom:vallox-ventilation
```

### Options

All options are optional and work for every strategy type.

| Option | Default | Description |
|---|---|---|
| `section` | `all` | Section strategy only: `all` (overview and history in one section), `overview` or `history`. |
| `sections` | `[overview, history]` | View and dashboard only: which sections to show, in that order. |
| `max_columns` | `3` | View and dashboard only: maximum number of section columns. |
| `device_id` | first unit found | Pick a specific unit when you have more than one. |
| `name` | device name | Title shown in the heading. |
| `entities` | auto | Override or add entities by role, e.g. `outdoor: sensor.my_outdoor_temp`. Set a role to `null` to hide it. |
| `show` | see below | Turn each new group off independently. Existing groups are unaffected. |
| `shower_boost_presets` | 15 min L6, 15 min L7, 30 min L6, 30 min L7 | List of `{minutes, level}` objects. Whole minutes 1–120 and fan levels 1–8; invalid entries are skipped. `[]` removes preset buttons. Your script must support the chosen values. |

Roles for `entities`: `climate`, `fan`, `boost_switch`, `switch_type`, `profile`, `profile_duration`, `fan_speed`,
`outdoor`, `supply`, `extract`, `exhaust`, `supply_cell`, `efficiency`, `humidity`, `humidity_2`, `co2`,
`status`, `motor_in`, `motor_out`, `front_heating`, `post_heating`, `summer_mode`, `bypass_locked`, `cell_state`,
`supply_fan_rpm`, `extract_fan_rpm`, `service_counter`, `service_needed`, `filter_time`, `filter_date`,
`target_home`, `target_away`, `target_boost`.

New entity roles in 1.1.0:

| Group | Roles |
|---|---|
| Alarms | `filter_warning`, `error_relay`, `cell_freeze_alarm`, `fault_code` |
| Built-in boost | `boost_remaining` |
| Unit setpoints (sensor tiles only) | `bypass_setpoint`, `preheat_setpoint`, `defrost_setpoint`, `defrost_hysteresis`, `post_heating_target`, `maximum_fan_speed` |
| Shower package | `shower_boost`, `shower_timer`, `shower_active`, `shower_cancel` |
| Humidity package | `auto_humidity_enabled`, `auto_humidity_threshold`, `auto_humidity_rise`, `auto_humidity_level`, `auto_humidity_minutes`, `auto_humidity_cooldown` |

Integration roles match the entity id or friendly name, independent of the device prefix.
The core Vallox **Supply air targets** controls remain separate from the read-only **Unit setpoints**.
The existing `efficiency` role can map a measured heat recovery sensor; otherwise the flow strip uses the same guarded estimate as the temperature group.

`show` keys are `alarms`, `boost_remaining`, `unit_setpoints`, `temperature_flow`, `shower_boost`, and `auto_humidity`.
All default to enabled when their required entities exist, except `temperature_flow`: its automatic default additionally requires at least one new alarm, setpoint or boost-remaining sensor. This preserves the 1.0.0 output for older units. Set `temperature_flow: true` to opt in on any unit with the four temperatures, including core Vallox; `false` always hides it.

Package defaults resolve from `hass.states`, even without entity-registry entries:

| Role | Default entity |
|---|---|
| `shower_boost` | `script.vallox_shower_boost` |
| `shower_timer` | `timer.vallox_shower_boost` |
| `shower_active` | `input_boolean.vallox_shower_boost_active` |
| `shower_cancel` | `script.vallox_shower_boost_cancel` |
| `auto_humidity_enabled` | `input_boolean.vallox_auto_humidity_boost` |
| `auto_humidity_threshold` | `input_number.vallox_auto_humidity_threshold` |
| `auto_humidity_rise` | `input_number.vallox_auto_humidity_rise` |
| `auto_humidity_level` | `input_number.vallox_auto_humidity_boost_level` |
| `auto_humidity_minutes` | `input_number.vallox_auto_humidity_boost_minutes` |
| `auto_humidity_cooldown` | `timer.vallox_auto_humidity_cooldown` |

The shower group needs its start script. Countdown and cancel additionally require **all three** timer, active helper and cancel script, and are visible only while the active helper is on. The humidity group needs its enable toggle and shows the other helpers that exist. Override any default via `entities`, or set it to `null` to suppress it. The default package controls one unit and is attached to the first selected unit only. With multiple units, use `device_id` to select the package's unit; for additional packages use separate strategies with explicit helper mappings.

```yaml
- strategy:
    type: custom:vallox-ventilation
    name: Ventilation
    entities:
      outdoor: sensor.weather_station_temperature
      humidity: sensor.bathroom_humidity
```

```yaml
- strategy:
    type: custom:vallox-ventilation
    show:
      alarms: true
      boost_remaining: true
      unit_setpoints: false
      temperature_flow: true
      shower_boost: true
      auto_humidity: false
    shower_boost_presets:
      - minutes: 15
        level: 6
      - minutes: 30
        level: 7
    entities:
      shower_boost: script.my_shower_boost
      shower_timer: timer.my_shower_boost
      shower_active: input_boolean.my_shower_boost_active
      shower_cancel: script.my_shower_boost_cancel
```

### Optional shower and humidity package

The optional package adds timed fan boosts and humidity automation for **HA 2025.1+ and vallox2mqtt fan modes 1-8**. Core Vallox needs compatible scripts of its own. The dashboard creates no helpers or automations; tiles appear when package entities exist (or equivalent entities are mapped). Buttons call the boost script with `level` and `minutes` on tap; the strategy itself never calls services.

1. Copy [`packages/vallox_shower_boost.yaml`](packages/vallox_shower_boost.yaml) into `<config>/packages/`. Use this package or existing equivalents to avoid duplicate entities with suffixed ids.
2. Adjust **every** `climate.ventilation`, `switch.ventilation_switch` (built-in boost/fireplace) and `binary_sensor.ventilation` (unit power/status) to your unit. Replace **both** `sensor.bathroom_humidity` placeholders. For multiple bathrooms, duplicate the threshold trigger per sensor and add each sensor to the rise trigger list.
3. Enable packages in `configuration.yaml`, merging into an existing `homeassistant:` block:

   ```yaml
   homeassistant:
     packages: !include_dir_named packages
   ```

4. Check the HA configuration, restart to load the package, then reload the dashboard/browser to discover entities. Later script/automation edits can be reloaded where applicable; helper/package changes may require another restart. Installation and activation are manual.

Auto humidity boost is **off on first creation**, then its toggle restores across restarts. Enable it to trigger above the humidity threshold for one minute, or on a rise in one sensor update while at least 55%. Defaults are **65%, +8 percentage points, level 6, 30 minutes**, with a one-hour cooldown that survives restart. Numeric humidity helpers reset to their YAML `initial` values on restart; edit those defaults or remove their `initial` keys to restore values instead. Threshold changes are evaluated on the sensor's next update; pending one-minute thresholds do not survive restart. Leave the toggle off for manual boosts only.

Safety behaviour:

- Repeat taps restart the duration and may change the target without overwriting the original saved level/on flag. A unit that was off starts in `fan_only`; restoration resets its fan level and leaves it running.
- Completion or cancel restores only while the package owns the setting and the fan still matches the target. Fan confirmation waits up to 60 seconds; a timeout retains ownership and the timer for normal restoration.
- External fan changes, unit power-off or built-in boost release ownership without forcing a restore. Humidity automation skips active shower/built-in boosts.
- Saved state helpers survive restart. A restored running timer continues; if it expired while HA was stopped, startup cleanup restores once unit entities load. If they remain unavailable, cleanup times out without a fan command.

### Explicit YAML (no custom code)

If you prefer a plain dashboard with no custom resource, copy one of the generated sections from
[`examples/`](examples) and adjust the entity ids:

- [`examples/section-vallox2mqtt.yaml`](examples/section-vallox2mqtt.yaml)
- [`examples/section-core-vallox.yaml`](examples/section-core-vallox.yaml)

You can also generate one for your own entities in the browser console of your dashboard:
`copy(JSON.stringify(valloxDashboard.buildSection(document.querySelector("home-assistant").hass, {})))`

## Notes

- **vallox2mqtt temperatures** have no `device_class` or `state_class`, so Home Assistant keeps no long-term
  statistics for them. The history cards use the recorder history (10 days by default).
- **Heat-recovery estimate:** it uses extract and exhaust air (the extract-side efficiency). Supply air can read low when the
  bypass is open (summer mode) or after defrost cycles. Treat the number as a trend, not a lab value.
- The strategies only read states and never call services by themselves. The controls in the tiles act only when you tap them.

## Development

```bash
node tests/run.mjs                                    # strategy tests against real and synthetic fixtures
node tests/explicit.mjs fixture_vallox2mqtt_1_2.json Ventilation   # print an explicit section as JSON
node tests/explicit.mjs fixture_vallox2mqtt_1_2.json Ventilation en --yaml # YAML with example header
```

The 1.2 fixture is sanitized from the reference states/registry and contains generic unit and package entities only. The old MQTT fixture is compared against a saved 1.0.0 section/view output. Tests also cover new roles, missing entities, group switches, action payloads and EN/DE label parity.

## License

[MIT](LICENSE)
