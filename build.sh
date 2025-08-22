#!/bin/bash

name=$(grep '"name"' manifest.json | head -1 | sed -E 's/.*"name": *"([^"]+)",?/\1/')
version=$(grep '"version"' manifest.json | head -1 | sed -E 's/.*"version": *"([^"]+)",?/\1/')

safe_name=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' )
safe_version=$(echo "$version" | tr '.' '_' )

zip_name="${safe_name}_${safe_version}.zip"

zip -r "$zip_name" icon.png manifest.json popup/

echo "created new package: $zip_name"