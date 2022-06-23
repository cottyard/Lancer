#!/bin/bash
git pull
cd ./browser
npm run build
cd ../server
tsc

