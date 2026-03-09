#!/bin/bash
cd /Users/wspark/.openclaw/workspace/pet-content-dashboard
node inject-trends.js >> data/trend-log.json 2>&1
