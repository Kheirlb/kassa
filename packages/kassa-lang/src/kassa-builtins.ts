export const builtinKassa = `
// ---- 2d symbols (components) ---

symbol Valve = {
  svg: "valve"
  label: bottom_mid
  port inlet  = { x: 30 y: 60 rot: 180 }
  port outlet = { x: 90 y: 60 rot: 0 }
}

symbol MotorValve <Valve> = {
  svg: "valve-m"
}

symbol SolenoidValve <Valve> = {
  svg: "valve-s"
}

symbol ThreeWayValve = {
  svg: "valve-3way"
  label: top
  port inlet   = { x: 30 y: 60 rot: 180 }
  port exhaust = { x: 60 y: 90 rot: 90 }
  port outlet  = { x: 90 y: 60 rot: 0 }
}

symbol ReliefValve = {
  svg: "relief-valve"
  label: left
  port inlet  = { x: 60 y: 100 rot: 90 }
  port outlet = { x: 100 y: 60 rot: 0 }
}

symbol CheckValve = {
  svg: "check-valve"
  label: bottom_mid
  // hideLabel: true
  port inlet  = { x: 20 y: 60 rot: 180 }
  port outlet = { x: 100 y: 60 rot: 0 }
}

symbol PressureReducingRegulator <Valve> = {
  svg: "pressure-reducing-regulator"
}

symbol Tee = {
  svg: "tee"
  label: bottom_mid
  // hideLabel: true
  port p1 = { x: 45 y: 60 rot: 180 }
  port p2 = { x: 60 y: 45 rot: 270 }
  port p3 = { x: 75 y: 60 rot: 0 }
}

symbol InlineTee = {
  svg: "tee-inline"
  label: bottom_mid
  // hideLabel: true
  port p1 = { x: 40 y: 60 rot: 180 }
  port p2 = { x: 80 y: 50 rot: 0 }
  port p3 = { x: 80 y: 70 rot: 0 }
}

symbol Splitter = {
  svg: "splitter"
  label: right
  // hideLabel: true
  port p1 = { x: 45 y: 60 rot: 180 }
  // Maths:
  // 60 + 10 + sqrt(12.5) ~= 73.5355
  // 60 - 7.929 - sqrt(12.5) ~= 48.5355
  // 60 + 7.929 + sqrt(12.5) ~= 71.4645
  port p2 = { x: 73.5355 y: 48.5355 rot: -45 }
  port p3 = { x: 73.5355 y: 71.4645 rot: 45 }
}

symbol Cross = {
  svg: "cross"
  label: bottom_right
  // hideLabel: true
  port p1 = { x: 45 y: 60 rot: 180 } // Left
  port p2 = { x: 60 y: 45 rot: 270 } // Top
  port p3 = { x: 75 y: 60 rot: 0 }   // Right
  port p4 = { x: 60 y: 75 rot: 90 }  // Bottom
}

symbol Fitting = {
  svg: "fitting"
  label: bottom_mid
  // hideLabel: true
  port inlet  = { x: 45 y: 60 rot: 180 }
  port outlet = { x: 75 y: 60 rot: 0 }
}

symbol FittingAdapter = {
  svg: "fitting-adapter"
  label: bottom_mid
  // hideLabel: true
  port small = { x: 45 y: 60 rot: 180 }
  port big   = { x: 75 y: 60 rot: 0 }
}

symbol Cylinder = {
  svg: "cylinder"
  label: bottom
  port p1 = { x: 60 y: 20 rot: 0 }
}

symbol Tank = {
  svg: "tank"
  label: bottom_mid
  port top = { x: 60 y: 35 rot: 270 }
  port bottom = { x: 85 y: 60 rot: 0 }
}

symbol Vessel = {
  svg: "vessel"
  label: bottom
  port p1 = { x: 25 y: 60 rot: 180 }
  port p2 = { x: 60 y: 35 rot: 270 }
  port p3 = { x: 95 y: 60 rot: 0 }
  port p4 = { x: 60 y: 85 rot: 90 }
}

symbol QuickDisconnect = {
  svg: "quick-disconnect"
  label: bottom_mid
  // hideLabel: true
  port inlet  = { x: 20 y: 60 rot: 180 }
  port outlet = { x: 100 y: 60 rot: 0 }
}
symbol QuickDisconnectWithCheck <QuickDisconnect> {
  svg: "quick-disconnect-check"
}
symbol QuickDisconnectMale <QuickDisconnect> {
  svg: "quick-disconnect-male"
}
symbol QuickDisconnectMaleWithCheck <QuickDisconnect> {
  svg: "quick-disconnect-male-check"
}
symbol QuickDisconnectFemale <QuickDisconnect> {
  svg: "quick-disconnect-female"
}
symbol QuickDisconnectFemaleWithCheck <QuickDisconnect> {
  svg: "quick-disconnect-female-check"
}

symbol Cap = {
  svg: "cap-or-plug"
  label: bottom_mid
  // hideLabel: true
  port p1 = { x: 55 y: 60 rot: 180 }
}
symbol Plug <Cap>

symbol Instrument1Port = {
  label: top
  port p1 = { x: 60 y: 80 rot: 90 }
}

symbol PressureTransducer <Instrument1Port> = { svg: "pressure-transducer" }
symbol Thermocouple <Instrument1Port> = { svg: "thermocouple" }
symbol PressureGauge <Instrument1Port> = {
  svg: "pressure-gauge"
  label: top_mid
}

symbol Engine = {
  svg: "engine"
  label: bottom
  port top1      = { x: 50 y: 15 rot: 270 }
  port top2      = { x: 60 y: 15 rot: 270 }
  port top3      = { x: 70 y: 15 rot: 270 }
  port chamberL1 = { x: 40 y: 40 rot: 180 }
  port chamberL2 = { x: 40 y: 60 rot: 180 }
  port chamberR1 = { x: 80 y: 40 rot: 0 }
  port chamberR2 = { x: 80 y: 60 rot: 0 }
}

symbol Pump = {
  svg: "pump"
  label: bottom
  port inlet  = { x: 20 y: 60 rot: 180 }
  port outlet = { x: 100 y: 60 rot: 0 }
}

symbol VacuumPump <Pump> = {
  svg: "pump-vacuum"
}

symbol Filter = {
  svg: "filter"
  label: bottom
  // hideLabel: true
  port inlet  = { x: 45 y: 60 rot: 180 }
  port outlet = { x: 75 y: 60 rot: 0 }
}

symbol Block = {
  svg: "block"
  label: bottom
  // hideLabel: true
  port inlet  = { x: 30 y: 60 rot: 180 }
  port top    = { x: 60 y: 30 rot: 270 }
  port outlet = { x: 90 y: 60 rot: 0 }
  port bottom = { x: 60 y: 90 rot: 90 }
}

symbol Hose = {
  svg: "hose"
  label: bottom
  // hideLabel: true
  port inlet  = { x: 0 y: 60 rot: 180 }
  port outlet = { x: 120 y: 60 rot: 0 }
}

// TODO: ---- separate symbols from components ---
// component Valve = {
//   symbol: ValveSymbol
// }
`.trimStart();
