import { bindings, defineConfig, exports } from "cf/config";

export default defineConfig({
  worker: {
    "name": "citizenesia",
    "entrypoint": "./worker/index.js",
    "compatibilityDate": "2026-10-23",
    "observability": {
      "enabled": true
    },
    "assets": {
      "notFoundHandling": "single-page-application",
      "runWorkerFirst": ["/api/*"]
    },
    "exports": {
      "Room": exports.durableObject({ storage: "sqlite" })
    },
    "env": {
      "ROOM": bindings.durableObject({ worker: "citizenesia", exportName: "Room" }),
      "ADMIN_KEY": bindings.secret()
    }
  }
});
