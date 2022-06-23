#!/bin/bash
git pull
cd ./browser
npm install
npm run build
cd ../server
tsc

