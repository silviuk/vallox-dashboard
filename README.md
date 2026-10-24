# Vallox Dashboard for Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
[![Validate](https://github.com/silviuk/vallox-dashboard/actions/workflows/validate.yml/badge.svg)](https://github.com/silviuk/vallox-dashboard/actions/workflows/validate.yml)

A modern, tile-based Lovelace UI for **Vallox ventilation units** (MVHR / heat-recovery ventilation).
It ships as **section, view and dashboard strategies**: the UI builds itself from your entities, so there is
nothing to configure. It uses **only built-in Home Assistant cards**: tile, heading, history-graph and markdown.

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

Roles for `entities`: `climate`, `fan`, `boost_switch`, `switch_type`, `profile`, `profile_duration`, `fan_speed`,
`outdoor`, `supply`, `extract`, `exhaust`, `supply_cell`, `efficiency`, `humidity`, `humidity_2`, `co2`,
`status`, `motor_in`, `motor_out`, `front_heating`, `post_heating`, `summer_mode`, `bypass_locked`, `cell_state`,
`supply_fan_rpm`, `extract_fan_rpm`, `service_counter`, `service_needed`, `filter_time`, `filter_date`,
`target_home`, `target_away`, `target_boost`.

```yaml
- strategy:
    type: custom:vallox-ventilation
    name: Ventilation
    entities:
      outdoor: sensor.weather_station_temperature
      humidity: sensor.bathroom_humidity
```

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
node tests/explicit.mjs fixture_vallox2mqtt.json Ventilation   # print an explicit section
```

## License

[MIT](LICENSE)
