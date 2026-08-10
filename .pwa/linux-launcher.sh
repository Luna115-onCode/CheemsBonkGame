#!/bin/bash
URL="${ManifestUrl}"
if command -v google-chrome &> /dev/null; then exec google-chrome --app="$URL"; elif command -v chromium &> /dev/null; then exec chromium --app="$URL"; else exec xdg-open "$URL"; fi
