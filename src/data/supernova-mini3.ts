/**
 * Proposed swap: Supernova Mini 3 Pro (W-MINI3P-MBLK) on the Bosch front-lamp port
 * A, keeping the stock tail light on rear port F and the brake-lever wiring.
 *
 * From the Supernova Mini 3 Pro manual (V 04.2025): 12 V DC; low beam 7 W, high
 * beam 12 W (standard) or 21 W (programmable); high beam toggled by a magnetic
 * push-button (micro gold connector) that also doubles as on/off. It ships with a
 * Bosch SMART SYSTEM cable, but the GSD Gen2 is Bosch System 2 / Gen 4 — a matching
 * System-2 connection cable is required. The 21 W mode is rated for Shimano/TQ/Alber/
 * Brose ports >=21 W; on the Bosch ~17 W front port the 12 W standard mode is the fit.
 */
const supernovaMini3 = `meta:
  id: supernova-mini3
  title: Supernova Mini 3 Pro — Proposed Swap
  bike: Tern GSD Gen2 R11
  notes: "Supernova Mini 3 Pro, 12V: low beam 7W, high beam 12W standard / 21W programmable. Ships with a Bosch SMART SYSTEM cable (U-SNPC-BS3C1300); the GSD Gen2 is Bosch System 2 / Gen 4, so you need the matching System-2 connection cable. High beam is a magnetic push-button (micro gold connector). The 21W high-beam mode wants a >=21W port (Shimano/TQ/Alber/Brose) — on the Bosch ~17W front port use the 12W standard mode. No tail pass-through: tail stays on Bosch rear port F."

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

  - id: snCable
    type: connector
    label: Supernova cable (needs Bosch System 2)
    props:
      connectorKind: supernova
    terminals:
      - { id: in, label: "to motor A", role: pos, color: blue }
      - { id: out, label: "to light", role: pos, color: blue }

  - id: hbSwitch
    type: switch
    label: High-Beam Switch (magnetic)
    props:
      switchKind: NO
      controlledBy: highbeam
    terminals:
      - { id: in, label: "12V in", role: pos, color: blue }
      - { id: out, label: "HB out", role: signal-out, color: yellow, signal: HIGHBEAM }

  - id: frontLight
    type: light
    label: Supernova Mini 3 Pro
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
  - id: n_motor_a
    label: "Motor port A 12V"
    color: blue
    members: [motor.a_front, snCable.in]
  - id: n_front_12v
    label: "Front lamp 12V"
    color: blue
    members: [snCable.out, frontLight.pos_in, hbSwitch.in]
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

export default supernovaMini3;
