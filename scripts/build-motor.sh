#!/bin/sh
# Gera api/_motor.js (motor do servidor) a partir do motor do cliente. Uso: sh scripts/build-motor.sh
cd "$(dirname "$0")/.." && npx --yes esbuild@0.25.0 api/_src/motor.js --bundle --minify --format=esm --platform=neutral --outfile=api/_motor.js
