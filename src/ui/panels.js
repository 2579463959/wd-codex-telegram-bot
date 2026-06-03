import { b, code } from "../telegram/html.js";

export function formatSettingPanelHtml({ titleText, current, description }) {
  return [
    b(titleText),
    `Current: ${code(current)}`,
    "",
    description
  ].join("\n");
}
