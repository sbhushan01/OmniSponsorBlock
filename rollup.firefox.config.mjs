import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const entries = [
  ["background", "src/background/index.js"],
  ["content-youtube", "src/content/content-youtube.js"],
  ["content-spotify", "src/content/content-spotify.js"],
  ["popup", "src/ui/popup.js"],
  ["options", "src/ui/options.js"]
];

export default entries.map(([name, input]) => ({
  input,
  output: {
    file: `dist/js/${name}.js`,
    format: "iife",
    sourcemap: false
  },
  plugins: [nodeResolve(), commonjs()]
}));
