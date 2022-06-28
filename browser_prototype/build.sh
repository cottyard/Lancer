#!/bin/bash
git pull
cd ./browser
npm run build
npm run build-ai
cd ../server
tsc
