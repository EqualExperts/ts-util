"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const convict = require("convict");
exports.getValueForEnvVar = (key) => process.env[key];
exports.buildConfigAdapter = (definition) => (key) => {
    const schema = {};
    Object.keys(definition).forEach((name) => schema[name] = { env: name, format: definition[name].format, default: null });
    const config = convict(schema);
    return config.get(key);
};
//# sourceMappingURL=adapter.js.map