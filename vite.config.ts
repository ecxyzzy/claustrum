import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  pack: {
    dts: true,
    exports: true,
    minify: {
      compress: true,
      mangle: true,
    },
    entry: {
      index: "./src/index.ts",
      adt: "./src/adt/index.ts",
      "adt/*": ["./src/adt/*.ts", "!./src/adt/index.ts"],
      collections: "./src/collections/index.ts",
      "collections/*": ["./src/collections/*.ts", "!./src/collections/index.ts"],
      numeric: "./src/numeric/index.ts",
      "numeric/*": ["./src/numeric/*.ts", "!./src/numeric/index.ts"],
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    arrowParens: "avoid",
    sortImports: true,
    sortPackageJson: true,
  },
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
