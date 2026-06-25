/**
 * Proposed swap: Supernova M99 Mini 3 Pro on the Bosch front-lamp port (A), keeping
 * the stock tail light on the rear-light port (F) and the brake-lever wiring. High
 * beam is modeled as a generic, re-routable switch into the M99's high-beam input.
 * The M99 (~21W) exceeds the front-lamp port's ~17W rating — flagged before install.
 */
const supernovaM99 = `meta:
  id: supernova-m99
  title: Supernova M99 Mini 3 Pro — Proposed Swap
  bike: Tern GSD Gen2 R11
  notes: "M99 on Bosch front-lamp port A; tail light stays on rear-light port F. High beam modeled as a generic switch into the M99 high-beam input — re-route the HIGHBEAM source (dedicated switch, Bosch remote, or HBM/brake adapter) as you decide. Verify all four functions before installing."

components:
  - id: motor
    type: source
    label: Bosch Cargo Line Gen 4 (BDU450 CX)
    terminals:
      - { id: a_front, label: "A · Front lamp 12V", role: pos, color: blue, maxWatts: 17 }
      - { id: b_speed, label: "B · Speed sensor 3.3V", role: pos, color: gray }
      - { id: c_batt, label: "C · Battery 36V", role: pos, color: black }
      - { id: d_disp, label: "D · Display 12V", role: pos, color: black }
      - { id: e_power, label: "E · Power Port 12V", role: pos, color: black }
      - { id: f_rear, label: "F · Rear light 12V", role: pos, color: black }
      - { id: gnd, label: "GND (common)", role: gnd, color: black }

  - id: hbSwitch
    type: switch
    label: High-Beam Switch (re-routable)
    props:
      switchKind: NO
      controlledBy: highbeam
    terminals:
      - { id: in, label: "12V in", role: pos, color: blue }
      - { id: out, label: "HB out", role: signal-out, color: yellow, signal: HIGHBEAM }

  - id: frontLight
    type: light
    label: Supernova M99 Mini 3 Pro
    props:
      powerWatts: 21
    terminals:
      - { id: pos_in, label: "12V+ in", role: pos, color: blue }
      - { id: gnd_in, label: "GND in", role: gnd, color: black }
      - { id: hb_in, label: "High beam", role: signal-in, color: yellow, signal: HIGHBEAM }

  - id: tailLight
    type: light
    label: Tail Light (brake light)
    props:
      powerWatts: 6
      brightensOnSignal: BRAKE
    terminals:
      - { id: pos_in, label: "12V+ in", role: pos, color: red }
      - { id: gnd_in, label: "GND in", role: gnd, color: black }
      - { id: brk_in, label: "Brake in", role: signal-in, color: green, signal: BRAKE }

  - id: brakeL
    type: switch
    label: Left Brake Lever
    props:
      switchKind: NO
      controlledBy: brakeL
    terminals:
      - { id: a, label: common, role: gnd, color: black }
      - { id: b, label: "brake out", role: signal-out, color: green, signal: BRAKE }

  - id: brakeR
    type: switch
    label: Right Brake Lever
    props:
      switchKind: NO
      controlledBy: brakeR
    terminals:
      - { id: a, label: common, role: gnd, color: black }
      - { id: b, label: "brake out", role: signal-out, color: green, signal: BRAKE }

  - id: brakeConn
    type: connector
    label: Higo 2-pin (brake)
    props:
      connectorKind: higo
    terminals:
      - { id: p1, label: "pin 1", role: signal-in, color: green }
      - { id: p2, label: "pin 2", role: signal-out, color: green }

nets:
  - id: n_front_12v
    label: "Front lamp 12V (port A)"
    color: blue
    members: [motor.a_front, frontLight.pos_in, hbSwitch.in]
  - id: n_gnd
    label: GND (common)
    color: black
    members: [motor.gnd, frontLight.gnd_in, tailLight.gnd_in, brakeL.a, brakeR.a]
  - id: n_hb
    label: High beam
    color: yellow
    signal: HIGHBEAM
    members: [hbSwitch.out, frontLight.hb_in]
  - id: n_rear_12v
    label: "Rear light 12V (port F)"
    color: red
    members: [motor.f_rear, tailLight.pos_in]
  - id: n_brake_levers
    label: Brake (levers)
    color: green
    signal: BRAKE
    members: [brakeL.b, brakeR.b, brakeConn.p1]
  - id: n_brake_tail
    label: Brake (to tail)
    color: green
    signal: BRAKE
    members: [brakeConn.p2, tailLight.brk_in]
`;

export default supernovaM99;
