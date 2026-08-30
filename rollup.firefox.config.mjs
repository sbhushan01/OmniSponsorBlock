import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import esbuild from "rollup-plugin-esbuild";
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";
import { string } from "rollup-plugin-string";

const entries = [
  ["background", "src/background/index.js"],
  ["content", "src/youtube/content.ts"],
  ["content-spotify", "src/spotify/content.ts"],
  ["popup", "src/ui/popup.js"],
  ["options", "src/ui/options.js"]
];

export default [
  // Build document.ts first
  {
    input: "src/youtube/document.ts",
    output: {
      file: "dist/js/document.js",
      format: "iife",
      sourcemap: false
    },
    plugins: [
      json(),
      nodeResolve({ browser: true, preferBuiltins: false, extensions: ['.js', '.ts', '.tsx', '.json'] }),
      commonjs(),
      esbuild({ target: 'es2020', jsx: 'transform' })
    ]
  },
  // Build main entries
  ...entries.map(([name, input]) => ({
    input,
    output: {
      file: `dist/js/${name}.js`,
      format: "iife",
      sourcemap: false
    },
    plugins: [
      string({ include: "**/document.js" }),
      json(),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        extensions: ['.js', '.ts', '.tsx', '.json']
      }),
      commonjs(),
      esbuild({
        target: 'es2020',
        jsx: 'transform'
      })
    ]
  }))
];
