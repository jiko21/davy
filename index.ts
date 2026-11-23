import React from "react";
import { render } from "ink";
import App from "./src/app";
import { loadConfig } from "./src/lib/config";
import pkg from "./package.json";

const args = process.argv.slice(2);
if (args.includes("--version") || args.includes("-v")) {
  console.log(pkg.version);
  process.exit(0);
}

const config = await loadConfig();
render(React.createElement(App, { initialConfig: config }), { alternateScreen: true });
