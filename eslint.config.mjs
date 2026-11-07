import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber mutates Three.js objects (camera, materials, refs) inside
    // useFrame by design; the React Compiler immutability rule cannot model that.
    files: ["src/components/game/**/*.tsx", "src/components/memory/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "coverage/**", "out/**"]),
]);
