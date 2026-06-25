/**
 * The harness as actually wired on the bike (from the photos): the front light,
 * tail light, and brake levers are interconnected through inline coaxial barrel
 * connectors and several soldered/heat-shrink SPLICES — not direct port-to-component
 * runs. Notably the tail light power is daisy-chained off the front-lamp feed via a
 * splice (so it loads the same port A), and both brake levers join at a 3-way splice
 * before the Higo connector. Use this as the starting point for planning a rewire.
 */
const asBuilt = `meta:
  id: as-built
  title: As-built Harness (spliced, from photos)
  bike: Tern GSD Gen2 R11
  notes: "Reverse-engineered from the harness photos: coaxial barrel connectors + soldered/heat-shrink splices. Tail power is daisy-chained off the front-lamp feed (loads port A), brake levers join at a 3-way splice. Best-effort — correct each splice to match your bike, then plan the rewire."

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
      - { id: f_rear, label: "F · Rear light 12V (unused)", role: pos, color: black }
      - { id: gnd, label: "GND (common)", role: gnd, color: black }

  - id: coaxA
    type: connector
    label: Coax barrel (front 12V)
    props:
      connectorKind: coax
    terminals:
      - { id: in, label: "in", role: pos, color: blue }
      - { id: out, label: "out", role: pos, color: blue }

  - id: spliceA
    type: splice
    label: 12V feed splice
    terminals:
      - { id: feed, label: "from motor", role: pos, color: blue }
      - { id: to_front, label: "to headlight", role: pos, color: blue }
      - { id: to_hb, label: "to HB switch", role: pos, color: blue }
      - { id: to_tail, label: "to tail (daisy)", role: pos, color: red }

  - id: hbSwitch
    type: switch
    label: High-Beam Switch
    props:
      switchKind: NO
      controlledBy: highbeam
    terminals:
      - { id: in, label: "12V in", role: pos, color: blue }
      - { id: out, label: "HB out", role: signal-out, color: yellow, signal: HIGHBEAM }

  - id: frontLight
    type: light
    label: Front Headlight (stock)
    props:
      powerWatts: 11
    terminals:
      - { id: pos_in, label: "12V+ in", role: pos, color: blue }
      - { id: gnd_in, label: "GND in", role: gnd, color: black }
      - { id: hb_in, label: "High beam", role: signal-in, color: yellow, signal: HIGHBEAM }

  - id: coaxTail
    type: connector
    label: Coax barrel (tail 12V)
    props:
      connectorKind: coax
    terminals:
      - { id: in, label: "in", role: pos, color: red }
      - { id: out, label: "out", role: pos, color: red }

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

  - id: spliceGnd
    type: splice
    label: Ground splice
    terminals:
      - { id: m, label: "from motor", role: gnd, color: black }
      - { id: f, label: "front", role: gnd, color: black }
      - { id: t, label: "tail", role: gnd, color: black }
      - { id: bl, label: "brake L", role: gnd, color: black }
      - { id: br, label: "brake R", role: gnd, color: black }

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

  - id: spliceBrake
    type: splice
    label: Brake splice (levers join)
    terminals:
      - { id: l, label: "left lever", role: signal-in, color: green }
      - { id: r, label: "right lever", role: signal-in, color: green }
      - { id: out, label: "to tail", role: signal-out, color: green, signal: BRAKE }

  - id: brakeConn
    type: connector
    label: Higo 2-pin (brake)
    props:
      connectorKind: higo
    terminals:
      - { id: p1, label: "pin 1", role: signal-in, color: green }
      - { id: p2, label: "pin 2", role: signal-out, color: green }

nets:
  - { id: nm_a_coax,      color: blue,  members: [motor.a_front, coaxA.in] }
  - { id: nm_coax_splice, color: blue,  members: [coaxA.out, spliceA.feed] }
  - { id: nm_splice_front,color: blue,  members: [spliceA.to_front, frontLight.pos_in] }
  - { id: nm_splice_hb,   color: blue,  members: [spliceA.to_hb, hbSwitch.in] }
  - { id: nm_splice_tail, color: red,   members: [spliceA.to_tail, coaxTail.in] }
  - { id: nm_coaxtail,    color: red,   members: [coaxTail.out, tailLight.pos_in] }
  - { id: nm_hb,          color: yellow, signal: HIGHBEAM, members: [hbSwitch.out, frontLight.hb_in] }

  - { id: ng_motor, color: black, members: [motor.gnd, spliceGnd.m] }
  - { id: ng_front, color: black, members: [spliceGnd.f, frontLight.gnd_in] }
  - { id: ng_tail,  color: black, members: [spliceGnd.t, tailLight.gnd_in] }
  - { id: ng_bl,    color: black, members: [spliceGnd.bl, brakeL.a] }
  - { id: ng_br,    color: black, members: [spliceGnd.br, brakeR.a] }

  - { id: nb_l,    color: green, signal: BRAKE, members: [brakeL.b, spliceBrake.l] }
  - { id: nb_r,    color: green, signal: BRAKE, members: [brakeR.b, spliceBrake.r] }
  - { id: nb_out,  color: green, signal: BRAKE, members: [spliceBrake.out, brakeConn.p1] }
  - { id: nb_tail, color: green, signal: BRAKE, members: [brakeConn.p2, tailLight.brk_in] }
`;

export default asBuilt;
