#!/bin/bash
rm -rf app
rm app.zip
zip -r app.zip index.html package.json node_modules
open node-webkit.app app.zip
