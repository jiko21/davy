import React from "react";
import { render } from "ink";
import App from "./src/app";
import { loadConfig } from "./src/lib/config";

const config = await loadConfig();
render(React.createElement(App, { initialConfig: config }), { alternateScreen: true });
