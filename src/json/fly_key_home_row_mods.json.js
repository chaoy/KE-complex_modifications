// JavaScript should be written in ECMAScript 5.1.

const karabiner = require('../lib/karabiner')

const parameters = {
  to_if_alone_timeout_milliseconds: 300,
  // Dual keys (caps_lock, quote, shifts): threshold for tap vs hold.
  to_if_held_down_threshold_milliseconds: 0,

  // Fly key: space must be held this long before fly key layer activates.
  // Prevents fast typing overlaps (space-down, letter-down, space-up) from
  // triggering fly combos. Safe because user's fly key pattern has space
  // outlasting the combo key — the gap between space-down and combo-key-down
  // is naturally > 100ms.
  fly_to_if_held_down_threshold_milliseconds: 100,

  // Fly key continuation: lower threshold for thumb-switch after fly key use.
  // After a fly key session (space held + combo used), the next space press
  // uses this shorter threshold to re-enter fly key quickly. Enables the
  // pattern: left thumb space hold → right hand cursor keys → left thumb
  // release → right thumb space hold → left hand delete keys.
  fly_continuation_threshold_milliseconds: 50,

  // HRM non-shift (A/S/D = Ctrl/Opt/Cmd, K/L/; = Cmd/Opt/Ctrl):
  // Modifier key always outlasts the target key for intentional use.
  // 200ms threshold prevents accidental modifier triggers during fast typing.
  hrm_to_if_held_down_threshold_milliseconds: 200,

  // HRM shift (F/J): higher threshold because shift+letter typing can produce
  // slight overlaps. The user holds F/J longer for intentional shift use,
  // so a higher threshold reliably distinguishes shift from fast typing.
  hrm_shift_to_if_held_down_threshold_milliseconds: 250,

  // Must be >= hrm_*_to_if_held_down_threshold so to_if_alone doesn't expire
  // before to_if_held_down fires. to_if_held_down preempts to_if_alone at
  // threshold time.
  hrm_to_if_alone_timeout_milliseconds: 1000,
}

function main() {
  console.log(
    JSON.stringify(
      {
        title: 'Fly Key + Home Row Mods',
        maintainers: ['chaoy'],
        rules: [
          {
            description: 'Fly Key + Home Row Mods (Space trigger, ASDF/JKL; modifiers)',
            manipulators: manipulators('spacebar'),
          },
        ],
      },
      null,
      '  '
    )
  )
}

function manipulators(triggerKeyCode) {
  var variable = 'fly_key'

  return [].concat(
    // ===== Section 1: Dual keys =====
    // caps_lock: tap = `~, hold = left_control
    dualKey('caps_lock', 'grave_accent_and_tilde', 'left_control'),
    // quote: tap = '", hold = right_control
    dualKey('quote', 'quote', 'right_control'),
    // left_shift: tap = \|, hold = left_shift
    dualKey('left_shift', 'backslash', 'left_shift'),
    // slash: tap = /?, hold = right_shift
    dualKey('slash', 'slash', 'right_shift'),

    // ===== Section 2: Fly key continuation (thumb-switch support) =====
    // After using fly key (space hold + combo), the next space press re-enters
    // fly key with a shorter threshold (50ms vs 100ms) for quick thumb switching.
    // Space tap clears the continuation state and sends space.
    flyKeyContinuation(variable),

    // ===== Section 3: Tap-then-hold for apps =====
    // After a space tap, the next space press sends plain spacebar immediately.
    // This allows apps that use held-space as a shortcut (pan, unmute, etc).
    // The flag is cleared on use, so the subsequent space press resumes fly key.
    tapThenHold(),

    // ===== Section 4: Fly key combos (space held) =====

    // -- Misc --
    twoPartTriggerCombo(triggerKeyCode, variable, 'b', 'tab', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'v', 'return_or_enter', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'z', 'escape', []),

    // -- Arrow keys --
    twoPartTriggerCombo(triggerKeyCode, variable, 'i', 'up_arrow', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'k', 'down_arrow', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'j', 'left_arrow', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'l', 'right_arrow', []),

    // -- Word movement (terminal-aware) --
    // u = word left: Option+Left / Esc,b
    fourPartTriggerCombo(triggerKeyCode, variable, 'u',
      [{ key_code: 'left_arrow', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'b' }]),
    // o = word right: Option+Right / Esc,f
    fourPartTriggerCombo(triggerKeyCode, variable, 'o',
      [{ key_code: 'right_arrow', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'f' }]),

    // -- Line start/end (Ctrl+A / Ctrl+E) --
    twoPartTriggerCombo(triggerKeyCode, variable, 'h', 'a', ['right_control']),
    twoPartTriggerCombo(triggerKeyCode, variable, 'semicolon', 'e', ['right_control']),

    // -- Line start/end (Cmd+Left / Cmd+Right, terminal-aware) --
    // y = line start: Cmd+Left / Esc,Ctrl+b
    fourPartTriggerCombo(triggerKeyCode, variable, 'y',
      [{ key_code: 'left_arrow', modifiers: ['left_command'] }],
      [{ key_code: 'escape' }, { key_code: 'b', modifiers: ['right_control'] }]),
    // p = line end: Cmd+Right / Esc,Ctrl+f
    fourPartTriggerCombo(triggerKeyCode, variable, 'p',
      [{ key_code: 'right_arrow', modifiers: ['left_command'] }],
      [{ key_code: 'escape' }, { key_code: 'f', modifiers: ['right_control'] }]),

    // -- Home / Page Up / Page Down / End --
    twoPartTriggerCombo(triggerKeyCode, variable, 'n', 'home', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'm', 'page_up', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'comma', 'page_down', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'period', 'end', []),

    // -- Top / Bottom --
    twoPartTriggerCombo(triggerKeyCode, variable, 'x', 'up_arrow', ['left_command']),
    twoPartTriggerCombo(triggerKeyCode, variable, 'c', 'down_arrow', ['left_command']),

    // -- Option+Up / Option+Down (terminal-aware) --
    fourPartTriggerCombo(triggerKeyCode, variable, 'q',
      [{ key_code: 'up_arrow', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'comma', modifiers: ['left_shift'] }]),
    fourPartTriggerCombo(triggerKeyCode, variable, 'a',
      [{ key_code: 'down_arrow', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'period', modifiers: ['left_shift'] }]),

    // -- Delete --
    twoPartTriggerCombo(triggerKeyCode, variable, 'd', 'delete_or_backspace', []),
    twoPartTriggerCombo(triggerKeyCode, variable, 'f', 'delete_forward', []),

    // -- Word delete (terminal-aware) --
    // e = word delete left: Option+Backspace / Esc,Backspace
    fourPartTriggerCombo(triggerKeyCode, variable, 'e',
      [{ key_code: 'delete_or_backspace', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'delete_or_backspace' }]),
    // r = word delete right: Option+Delete / Esc,d
    fourPartTriggerCombo(triggerKeyCode, variable, 'r',
      [{ key_code: 'delete_forward', modifiers: ['left_option'] }],
      [{ key_code: 'escape' }, { key_code: 'd' }]),

    // -- Line editing (terminal-aware) --
    // s = select all + kill: Ctrl+Shift+A, Ctrl+K / Ctrl+U
    fourPartTriggerCombo(triggerKeyCode, variable, 's',
      [
        { key_code: 'a', modifiers: ['right_control', 'right_shift'] },
        { key_code: 'k', modifiers: ['left_control'] },
      ],
      [{ key_code: 'u', modifiers: ['left_control'] }]),
    // g = kill to end of line: Ctrl+K
    twoPartTriggerCombo(triggerKeyCode, variable, 'g', 'k', ['left_control']),
    // w = delete to line start: Cmd+Backspace / Ctrl+W
    fourPartTriggerCombo(triggerKeyCode, variable, 'w',
      [{ key_code: 'delete_or_backspace', modifiers: ['left_command'] }],
      [{ key_code: 'w', modifiers: ['left_control'] }]),
    // t = delete to line end: Cmd+Shift+Right, Delete / Esc, Ctrl+D
    fourPartTriggerCombo(triggerKeyCode, variable, 't',
      [{ key_code: 'right_arrow', modifiers: ['left_command', 'left_shift'] }, { key_code: 'delete_forward' }],
      [{ key_code: 'escape' }, { key_code: 'd', modifiers: ['left_control'] }]),

    // ===== Section 5: Trigger key (space) =====
    triggerKey(triggerKeyCode, variable),

    // ===== Section 6: Home row mods (disabled during fly key) =====
    // Shift (F/J): higher threshold (250ms) since shift+letter overlaps are
    // common during fast typing. The modifier outlasts the target key for
    // intentional use.
    homeRowMod('f', 'left_shift', variable, true),
    homeRowMod('j', 'right_shift', variable, true),
    // Non-shift (Ctrl/Opt/Cmd): standard threshold (200ms). Modifier always
    // outlasts the target key for intentional use.
    homeRowMod('a', 'left_control', variable, false),
    homeRowMod('s', 'left_option', variable, false),
    homeRowMod('d', 'left_command', variable, false),
    homeRowMod('k', 'right_command', variable, false),
    homeRowMod('l', 'right_option', variable, false),
    homeRowMod('semicolon', 'right_control', variable, false)
  )
}

// Dual-role key: tap sends one key, hold sends another
function dualKey(input, alone, held_down) {
  return [
    {
      type: 'basic',
      from: { key_code: input, modifiers: { optional: ['any'] } },
      to_if_alone: [{ key_code: alone }],
      to_if_held_down: [{ key_code: held_down }],
      parameters: {
        'basic.to_if_alone_timeout_milliseconds': parameters.to_if_alone_timeout_milliseconds,
        'basic.to_if_held_down_threshold_milliseconds': parameters.to_if_held_down_threshold_milliseconds,
      },
    },
  ]
}

// Fly key continuation: after fly key was used (space held + combo pressed),
// the next space press re-enters fly key mode with a shorter threshold.
// This supports the thumb-switch pattern: left space hold → right hand combos
// → left space release → right space hold → left hand combos.
//
// Resolution paths:
//   - Held past 50ms → re-enter fly key layer (fly_key=1)
//   - Released before timeout, no other key → tap: clear flag, send space,
//     set space_tapped_recently for tap-then-hold
//   - Another key pressed before 50ms → to_if_canceled: clear flag, send
//     space (fast typing overlap during continuation state)
//
// The fly_key_was_activated flag persists through non-space key presses but
// is cleared on every space tap. In practice: after fly key use, typing a
// space (word boundary) clears the flag, so the next space hold uses the
// normal 100ms threshold.
function flyKeyContinuation(variable) {
  return [
    {
      type: 'basic',
      from: { key_code: 'spacebar', modifiers: { optional: ['any'] } },
      to: [
        { set_variable: { name: variable, value: 0 } },
      ],
      to_if_alone: [
        { set_variable: { name: 'fly_key_was_activated', value: 0 } },
        { set_variable: { name: variable, value: 0 } },
        { set_variable: { name: 'space_tapped_recently', value: 1 } },
        { key_code: 'spacebar', halt: true },
      ],
      to_if_held_down: [
        { set_variable: { name: variable, value: 1 } },
      ],
      to_after_key_up: [
        { set_variable: { name: variable, value: 0 } },
        { key_code: 'vk_none' },
      ],
      to_delayed_action: {
        to_if_invoked: [],
        to_if_canceled: [
          { set_variable: { name: 'fly_key_was_activated', value: 0 } },
          { set_variable: { name: variable, value: 0 } },
          { key_code: 'spacebar' },
        ],
      },
      conditions: [
        { type: 'variable_if', name: 'fly_key_was_activated', value: 1 },
      ],
      parameters: {
        'basic.to_if_held_down_threshold_milliseconds': parameters.fly_continuation_threshold_milliseconds,
        'basic.to_if_alone_timeout_milliseconds': parameters.to_if_alone_timeout_milliseconds,
        'basic.to_delayed_action_delay_milliseconds': parameters.fly_continuation_threshold_milliseconds,
      },
    },
  ]
}

// Tap-then-hold: after a space tap, the next space press sends plain spacebar
// immediately (via `to`), so held-space shortcuts in apps work (pan, unmute).
// The flag is cleared on this press, so the subsequent space press resumes
// normal fly key behavior.
//
// The space_tapped_recently flag persists until the next space press. If you
// tap space during typing and later hold space, you'll get one plain space
// hold (clearing the flag), then fly key resumes. This is a minor quirk
// accepted as a trade-off for the simplicity of the mechanism.
function tapThenHold() {
  return [
    {
      type: 'basic',
      from: { key_code: 'spacebar', modifiers: { optional: ['any'] } },
      to: [
        { set_variable: { name: 'space_tapped_recently', value: 0 } },
        { key_code: 'spacebar' },
      ],
      conditions: [
        { type: 'variable_if', name: 'space_tapped_recently', value: 1 },
      ],
    },
  ]
}

// Space trigger: hold activates fly key layer (after threshold), tap sends space.
//
// Three resolution paths:
//   - Held past threshold (100ms) → fly_key=1, fly_key_was_activated=1
//   - Released before timeout, no other key → tap: space + set
//     space_tapped_recently for tap-then-hold
//   - Another key pressed before threshold → to_if_canceled: space character
//     (fast typing overlap — both space and the key produce normal output)
//
// The 100ms threshold prevents fast typing overlaps from triggering fly combos.
// The user's fly key pattern has space outlasting the combo key, so the
// natural gap between space-down and combo-key-down exceeds the threshold.
function triggerKey(triggerKeyCode, variable) {
  return [
    {
      type: 'basic',
      from: { key_code: triggerKeyCode, modifiers: { optional: ['any'] } },
      to: [
        { set_variable: { name: variable, value: 0 } },
      ],
      to_if_alone: [
        { set_variable: { name: variable, value: 0 } },
        { set_variable: { name: 'space_tapped_recently', value: 1 } },
        { key_code: triggerKeyCode, halt: true },
      ],
      to_if_held_down: [
        { set_variable: { name: variable, value: 1 } },
        { set_variable: { name: 'fly_key_was_activated', value: 1 } },
      ],
      to_after_key_up: [
        { set_variable: { name: variable, value: 0 } },
        { key_code: 'vk_none' },
      ],
      to_delayed_action: {
        to_if_invoked: [],
        to_if_canceled: [
          { set_variable: { name: variable, value: 0 } },
          { key_code: triggerKeyCode },
        ],
      },
      parameters: {
        'basic.to_if_alone_timeout_milliseconds': parameters.to_if_alone_timeout_milliseconds,
        'basic.to_if_held_down_threshold_milliseconds': parameters.fly_to_if_held_down_threshold_milliseconds,
        'basic.to_delayed_action_delay_milliseconds': parameters.fly_to_if_held_down_threshold_milliseconds,
      },
    },
  ]
}

// Fly key combo: when fly_key variable is active, remap the key.
// The fly key layer is activated by triggerKey (after threshold) or
// flyKeyContinuation (after recent fly key use), so the variable_if
// condition catches all combos without simultaneous detection.
function twoPartTriggerCombo(triggerKeyCode, variable, fromKeyCode, toKeyCode, toModifiers) {
  return [
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: [{ key_code: toKeyCode, modifiers: toModifiers }],
      conditions: [{ type: 'variable_if', name: variable, value: 1 }],
    },
  ]
}

// Terminal-aware fly key combo: different output for terminal vs non-terminal apps.
function fourPartTriggerCombo(triggerKeyCode, variable, fromKeyCode, normalTo, terminalTo) {
  return [
    // Non-terminal
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: normalTo,
      conditions: [
        { type: 'frontmost_application_unless', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
        { type: 'variable_if', name: variable, value: 1 },
      ],
    },
    // Terminal
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: terminalTo,
      conditions: [
        { type: 'frontmost_application_if', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
        { type: 'variable_if', name: variable, value: 1 },
      ],
    },
  ]
}

// Home row mod: letter on tap, modifier on hold. Disabled when fly key is active.
//
// Three resolution paths:
//   - Released before threshold, no other key → `to_if_alone` fires (letter + halt)
//   - Held past threshold → `to_if_held_down` fires (modifier)
//   - Another key pressed before delay → `to_delayed_action.to_if_canceled` fires (letter)
//
// Split thresholds: shift keys (F/J) use 250ms because shift+letter overlaps
// are common during fast typing. Non-shift keys (Ctrl/Opt/Cmd) use 200ms
// because the modifier always outlasts the target key for intentional use.
//
// The to_delayed_action handles the "overlap" typing pattern where a home row key
// is pressed and released quickly while another key is also pressed. Without it,
// the first key would be eaten (no output) because to_if_alone is canceled by
// the interrupting key and to_if_held_down threshold wasn't reached.
//
// `halt: true` in to_if_alone prevents subsequent key events from triggering
// to_if_canceled after the tap has already been resolved, avoiding double-fire.
//
// Note: `to` is intentionally omitted to avoid double-character on single tap.
function homeRowMod(keyCode, modifier, flyKeyVariable, isShift) {
  var threshold = isShift
    ? parameters.hrm_shift_to_if_held_down_threshold_milliseconds
    : parameters.hrm_to_if_held_down_threshold_milliseconds
  return [
    {
      type: 'basic',
      from: { key_code: keyCode, modifiers: { optional: ['any'] } },
      to_if_alone: [{ key_code: keyCode, halt: true }],
      to_if_held_down: [{ key_code: modifier }],
      to_delayed_action: {
        to_if_invoked: [],
        to_if_canceled: [{ key_code: keyCode }],
      },
      conditions: [
        { type: 'variable_unless', name: flyKeyVariable, value: 1 },
      ],
      parameters: {
        'basic.to_if_alone_timeout_milliseconds': parameters.hrm_to_if_alone_timeout_milliseconds,
        'basic.to_if_held_down_threshold_milliseconds': threshold,
        'basic.to_delayed_action_delay_milliseconds': 150,
      },
    },
  ]
}

main()
