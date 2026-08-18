#!/bin/sh
cd "c:/Users/yasch/Coding Projects/Website Projects/nomadcompass"
PROBE="https://archive-api.open-meteo.com/v1/archive?latitude=41.39&longitude=2.17&start_date=2023-01-01&end_date=2023-01-02&daily=temperature_2m_max&timezone=auto"
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "$PROBE")
  echo "probe $i: HTTP $code"
  if [ "$code" = "200" ]; then
    node scripts/build_city_climate.cjs > "c:/tmp/climate_pass_${i}.log" 2>&1
    count=$(node -e "try{console.log(Object.keys(require('c:/tmp/nomad-climate-cache.json')).length)}catch(e){console.log(0)}")
    echo "  pass done, cache=$count"
    if [ "$count" -ge 398 ]; then echo "REACHED $count"; break; fi
    sleep 90
  else
    sleep 300
  fi
done
node -e "console.log('FINAL cache',Object.keys(require('c:/tmp/nomad-climate-cache.json')).length)"
echo "WAITER DONE"
