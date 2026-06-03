export function booleanOptionKeyboardRows(key, settingsLabel) {
  return [
    [
      { text: "default", callback_data: `set:${key}:default` },
      { text: "on", callback_data: `set:${key}:on` },
      { text: "off", callback_data: `set:${key}:off` }
    ],
    [{ text: settingsLabel, callback_data: "p:settings" }]
  ];
}
