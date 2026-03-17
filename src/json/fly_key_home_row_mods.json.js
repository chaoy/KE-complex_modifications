// JavaScript should be written in ECMAScript 5.1.

const karabiner = require('../lib/karabiner')

const parameters = {
  to_if_alone_timeout_milliseconds: 300,
  to_delayed_action_delay_milliseconds: 0,
  to_if_held_down_threshold_milliseconds: 0,
  simultaneous_threshold_milliseconds: 300,
  // Home row mods: key must be held for this duration before modifier activates.
  // Higher = fewer accidental modifier triggers during fast typing.
  // Lower = more responsive intentional modifier use. 200ms is a good balance.
  hrm_to_if_held_down_threshold_milliseconds: 200,
  // Must be >= hrm_to_if_held_down_threshold so to_if_alone doesn't expire before
  // to_if_held_down fires. to_if_held_down preempts to_if_alone at threshold time.
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

    // ===== Section 2: Fly-key-then-hold bypass =====
    // After using fly key layer (space hold + release), next space press sends plain spacebar.
    // This allows apps that use held-space as a shortcut.
    flyKeyThenHold(),

    // ===== Section 3: Fly key combos (space held) =====

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

    // ===== Section 4: Trigger key (space) =====
    triggerKey(triggerKeyCode, variable),

    // ===== Section 5: Home row mods (disabled during fly key) =====
    homeRowMod('a', 'left_control', variable),
    homeRowMod('s', 'left_option', variable),
    homeRowMod('d', 'left_command', variable),
    homeRowMod('f', 'left_shift', variable),
    homeRowMod('j', 'right_shift', variable),
    homeRowMod('k', 'right_command', variable),
    homeRowMod('l', 'right_option', variable),
    homeRowMod('semicolon', 'right_control', variable)
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

// Space trigger: hold activates fly key layer, tap sends space.
// When fly key was used (held), sets fly_key_was_activated so the next space press is plain.
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
        'basic.to_delayed_action_delay_milliseconds': parameters.to_delayed_action_delay_milliseconds,
        'basic.to_if_held_down_threshold_milliseconds': parameters.to_if_held_down_threshold_milliseconds,
      },
    },
  ]
}

// Fly-key-then-hold: after fly key was used (space held + released), next space press
// sends plain spacebar instead of activating fly key again. This allows apps that use
// held-space as a shortcut. The flag is cleared on this press, so the subsequent space
// press will activate fly key normally.
function flyKeyThenHold() {
  return [
    {
      type: 'basic',
      from: { key_code: 'spacebar', modifiers: { optional: ['any'] } },
      to: [
        { set_variable: { name: 'fly_key_was_activated', value: 0 } },
        { key_code: 'spacebar' },
      ],
      conditions: [
        { type: 'variable_if', name: 'fly_key_was_activated', value: 1 },
      ],
    },
  ]
}

// Two-part fly key combo: variable_if + simultaneous detection
function twoPartTriggerCombo(triggerKeyCode, variable, fromKeyCode, toKeyCode, toModifiers) {
  return [
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: [{ key_code: toKeyCode, modifiers: toModifiers }],
      conditions: [{ type: 'variable_if', name: variable, value: 1 }],
    },
    {
      type: 'basic',
      from: {
        simultaneous: [{ key_code: triggerKeyCode }, { key_code: fromKeyCode }],
        simultaneous_options: {
          key_down_order: 'strict',
          key_up_order: 'strict_inverse',
          detect_key_down_uninterruptedly: true,
          to_after_key_up: [{ set_variable: { name: variable, value: 0 } }],
        },
        modifiers: { optional: ['any'] },
      },
      to: [
        { set_variable: { name: variable, value: 1 } },
        { key_code: toKeyCode, modifiers: toModifiers },
      ],
      parameters: {
        'basic.simultaneous_threshold_milliseconds': parameters.simultaneous_threshold_milliseconds,
      },
    },
  ]
}

// Four-part fly key combo: terminal-aware (different output for terminal vs non-terminal apps)
function fourPartTriggerCombo(triggerKeyCode, variable, fromKeyCode, normalTo, terminalTo) {
  return [
    // Non-terminal: variable_if
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: normalTo,
      conditions: [
        { type: 'frontmost_application_unless', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
        { type: 'variable_if', name: variable, value: 1 },
      ],
    },
    // Non-terminal: simultaneous
    {
      type: 'basic',
      from: {
        simultaneous: [{ key_code: triggerKeyCode }, { key_code: fromKeyCode }],
        simultaneous_options: {
          key_down_order: 'strict',
          key_up_order: 'strict_inverse',
          detect_key_down_uninterruptedly: true,
          to_after_key_up: [{ set_variable: { name: variable, value: 0 } }],
        },
        modifiers: { optional: ['any'] },
      },
      to: [{ set_variable: { name: variable, value: 1 } }].concat(normalTo),
      parameters: {
        'basic.simultaneous_threshold_milliseconds': parameters.simultaneous_threshold_milliseconds,
      },
      conditions: [
        { type: 'frontmost_application_unless', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
      ],
    },
    // Terminal: variable_if
    {
      type: 'basic',
      from: { key_code: fromKeyCode, modifiers: { optional: ['any'] } },
      to: terminalTo,
      conditions: [
        { type: 'frontmost_application_if', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
        { type: 'variable_if', name: variable, value: 1 },
      ],
    },
    // Terminal: simultaneous
    {
      type: 'basic',
      from: {
        simultaneous: [{ key_code: triggerKeyCode }, { key_code: fromKeyCode }],
        simultaneous_options: {
          key_down_order: 'strict',
          key_up_order: 'strict_inverse',
          detect_key_down_uninterruptedly: true,
          to_after_key_up: [{ set_variable: { name: variable, value: 0 } }],
        },
        modifiers: { optional: ['any'] },
      },
      to: [{ set_variable: { name: variable, value: 1 } }].concat(terminalTo),
      parameters: {
        'basic.simultaneous_threshold_milliseconds': parameters.simultaneous_threshold_milliseconds,
      },
      conditions: [
        { type: 'frontmost_application_if', bundle_identifiers: karabiner.bundleIdentifiers.terminal },
      ],
    },
  ]
}

// Home row mod: letter on tap, modifier on held. Disabled when fly key is active.
//
// Uses only to_if_alone + to_if_held_down (no `to`):
//   - Key down → Karabiner defers (waits to determine tap vs hold)
//   - Released before threshold, no other key → `to_if_alone` fires (letter)
//   - Held past threshold → `to_if_held_down` fires (modifier)
//
// Note: `to` is intentionally omitted. Including `to` with the letter causes
// double-character output because `to` fires immediately on key-down while
// `to_if_alone` fires additionally on key-up.
function homeRowMod(keyCode, modifier, flyKeyVariable) {
  return [
    {
      type: 'basic',
      from: { key_code: keyCode, modifiers: { optional: ['any'] } },
      to_if_alone: [{ key_code: keyCode }],
      to_if_held_down: [{ key_code: modifier }],
      conditions: [
        { type: 'variable_unless', name: flyKeyVariable, value: 1 },
      ],
      parameters: {
        'basic.to_if_alone_timeout_milliseconds': parameters.hrm_to_if_alone_timeout_milliseconds,
        'basic.to_if_held_down_threshold_milliseconds': parameters.hrm_to_if_held_down_threshold_milliseconds,
      },
    },
  ]
}

main()
