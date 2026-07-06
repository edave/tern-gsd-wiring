/**
 * The harness as actually spliced on the bike, transcribed from labeled photos
 * where every wire is numbered on both sides of its coax/bullet connector and
 * every cable is tagged with blue tape.
 *
 * Cables (blue-tape labels) and their numbered wires:
 *   - FL Port  (Bosch front-light port): #8 = +12V (red), #1 = GND (black)
 *   - RL Port  (Bosch rear-light port):  #7 = +12V (red), #6 = GND (black)
 *   - Front    (headlight pigtail):      #4 = high-beam (yellow), #5 = +12V (black), #6 = GND (black)
 *   - Rear     (tail-light pigtail):     #7 = +12V (red), #3 = GND (black), #2 = brake (green)
 *   - HB       (Bosch high-beam/brake accessory): #4 = high-beam (yellow), #2 = brake (green)
 *
 * Numbered connectors (each joins the two like-numbered wire ends):
 *   1 FL Port GND -> ground splice        5 Front +12V  -> 12V/high-beam splice
 *   2 HB brake    -> Rear (tail) brake     6 Front GND   -> RL Port GND
 *   3 Tail GND    -> ground splice         7 RL Port +12V-> Tail +12V
 *   4 HB high-beam-> Front high-beam        8 FL Port +12V-> 12V/high-beam splice
 *
 * Front +12V is fed from the FRONT Bosch port and its ground returns via the REAR
 * port (connector 6); the tail is fed from the REAR port and grounds via the FRONT
 * port (connectors 3->1) — the drive unit commons both port grounds internally.
 */
const asBuilt = `meta:
  id: as-spliced
  title: As-spliced Harness (numbered wires, from photos)
  bike: Tern GSD Gen2 R11
  notes: "Transcribed from labeled photos: each wire numbered on both sides of its coax/bullet connector (1-8), each cable blue-taped (FL Port, RL Port, Front, Rear, HB). High-beam (yellow #4) and brake (green #2) ride the Bosch HB accessory cable. Connectors: 1 FLgnd->gndSplice, 2 HBbrake->tail, 3 tailGnd->gndSplice, 4 HBhb->front, 5 front+->hbSplice, 6 frontGnd->RLgnd, 7 RL+->tail+, 8 FL+->hbSplice."

components:
  - id: motor
    type: source
    label: Bosch Cargo Line Gen 4 (BDU450 CX)
    terminals:
      - { id: fl_pos, label: "FL Port +12V (#8)", role: pos, color: red, maxWatts: 17 }
      - { id: fl_gnd, label: "FL Port GND (#1)", role: gnd, color: black }
      - { id: rl_pos, label: "RL Port +12V (#7)", role: pos, color: red, maxWatts: 12 }
      - { id: rl_gnd, label: "RL Port GND (#6)", role: gnd, color: black }

  - id: conn8
    type: connector
    label: "⑧ FL+ ↔ HB splice"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "FL Port side", role: pos, color: red }
      - { id: b, label: "HB splice side", role: pos, color: red }

  - id: conn1
    type: connector
    label: "① FL GND ↔ gnd splice"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "FL Port side", role: gnd, color: black }
      - { id: b, label: "gnd splice side", role: gnd, color: black }

  - id: spliceHB
    type: splice
    label: 12V + High-Beam splice
    terminals:
      - { id: feed, label: "from FL+ (#8)", role: pos, color: red, side: left }
      - { id: to_front, label: "to Front + (#5)", role: pos, color: red, side: right }
      - { id: to_hb, label: "to HB switch", role: pos, color: red, side: right }
      - { id: to_brk, label: "to brake switch", role: pos, color: red, side: right }

  - id: hbSwitch
    type: switch
    label: High-Beam Switch
    props:
      switchKind: NO
      controlledBy: highbeam
    terminals:
      - { id: in, label: "12V in", role: pos, color: red }
      - { id: out, label: "HB out (#4)", role: signal-out, color: yellow, signal: HIGHBEAM }

  - id: brakeSwitch
    type: switch
    label: Brake (Bosch signal)
    props:
      switchKind: NO
      controlledBy: brake
    terminals:
      - { id: in, label: "12V in", role: pos, color: red }
      - { id: out, label: "brake out (#2)", role: signal-out, color: green, signal: BRAKE }

  - id: conn4
    type: connector
    label: "④ HB ↔ Front high-beam"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "HB side", role: passthrough, color: yellow }
      - { id: b, label: "Front side", role: passthrough, color: yellow }

  - id: conn5
    type: connector
    label: "⑤ Front+ ↔ HB splice"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "Front side", role: pos, color: red }
      - { id: b, label: "HB splice side", role: pos, color: red }

  - id: frontLight
    type: light
    label: Front Headlight (stock)
    props:
      powerWatts: 11
    terminals:
      - { id: pos_in, label: "+12V in (#5)", role: pos, color: black }
      - { id: gnd_in, label: "GND in (#6)", role: gnd, color: black }
      - { id: hb_in, label: "High beam (#4)", role: signal-in, color: yellow, signal: HIGHBEAM }

  - id: conn6
    type: connector
    label: "⑥ Front GND ↔ RL GND"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "Front side", role: gnd, color: black }
      - { id: b, label: "RL Port side", role: gnd, color: black }

  - id: conn7
    type: connector
    label: "⑦ RL+ ↔ Tail+"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "RL Port side", role: pos, color: red }
      - { id: b, label: "Tail side", role: pos, color: red }

  - id: conn2
    type: connector
    label: "② HB brake ↔ Tail"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "HB side", role: passthrough, color: green }
      - { id: b, label: "Tail side", role: passthrough, color: green }

  - id: conn3
    type: connector
    label: "③ Tail GND ↔ gnd splice"
    props: { connectorKind: bullet }
    terminals:
      - { id: a, label: "Tail side", role: gnd, color: black }
      - { id: b, label: "gnd splice side", role: gnd, color: black }

  - id: tailLight
    type: light
    label: Tail Light (brake light)
    props:
      powerWatts: 6
      brightensOnSignal: BRAKE
    terminals:
      - { id: pos_in, label: "+12V in (#7)", role: pos, color: red }
      - { id: gnd_in, label: "GND in (#3)", role: gnd, color: black }
      - { id: brk_in, label: "Brake in (#2)", role: signal-in, color: green, signal: BRAKE }

  - id: spliceGnd
    type: splice
    label: Common ground splice
    terminals:
      - { id: fl, label: "FL Port GND (#1)", role: gnd, color: black, side: left }
      - { id: t, label: "Tail GND (#3)", role: gnd, color: black, side: left }

nets:
  # ---- Cable conductors (grouped into cables below) ----
  # FL Port cable
  - { id: n_fl_pos, color: red,   members: [motor.fl_pos, conn8.a] }
  - { id: n_fl_gnd, color: black, members: [motor.fl_gnd, conn1.a] }
  # RL Port cable
  - { id: n_rl_pos, color: red,   members: [motor.rl_pos, conn7.a] }
  - { id: n_rl_gnd, color: black, members: [motor.rl_gnd, conn6.b] }
  # Front headlight pigtail
  - { id: n_fr_hb,  color: yellow, signal: HIGHBEAM, members: [frontLight.hb_in, conn4.b] }
  - { id: n_fr_pos, color: black,  members: [frontLight.pos_in, conn5.a] }
  - { id: n_fr_gnd, color: black,  members: [frontLight.gnd_in, conn6.a] }
  # Rear (tail) pigtail
  - { id: n_tl_pos, color: red,   members: [tailLight.pos_in, conn7.b] }
  - { id: n_tl_gnd, color: black, members: [tailLight.gnd_in, conn3.a] }
  - { id: n_tl_brk, color: green, signal: BRAKE, members: [tailLight.brk_in, conn2.b] }

  # ---- Connector far sides -> splices / switches ----
  - { id: n_c8, color: red,    members: [conn8.b, spliceHB.feed] }
  - { id: n_c5, color: red,    members: [conn5.b, spliceHB.to_front] }
  - { id: n_c4, color: yellow, signal: HIGHBEAM, members: [conn4.a, hbSwitch.out] }
  - { id: n_c2, color: green,  signal: BRAKE, members: [conn2.a, brakeSwitch.out] }
  - { id: n_c1, color: black,  members: [conn1.b, spliceGnd.fl] }
  - { id: n_c3, color: black,  members: [conn3.b, spliceGnd.t] }

  # ---- 12V feeds to the signal switches (off the HB splice) ----
  - { id: n_hb_feed,  color: red, members: [spliceHB.to_hb, hbSwitch.in] }
  - { id: n_brk_feed, color: red, members: [spliceHB.to_brk, brakeSwitch.in] }

cables:
  - id: cableFLPort
    label: "FL Port (Bosch front)"
    gauge: "18 AWG"
    conductors: [n_fl_pos, n_fl_gnd]
  - id: cableRLPort
    label: "RL Port (Bosch rear)"
    gauge: "18 AWG"
    conductors: [n_rl_pos, n_rl_gnd]
  - id: cableFront
    label: "Front (headlight)"
    gauge: "20 AWG"
    conductors: [n_fr_pos, n_fr_gnd, n_fr_hb]
  - id: cableRear
    label: "Rear (tail light)"
    gauge: "20 AWG"
    conductors: [n_tl_pos, n_tl_gnd, n_tl_brk]
`;

export default asBuilt;
