#!/bin/zsh
set -euo pipefail

user_home="${HOME}"
label="com.rincon-rent.daily-link"
plist_path="${user_home}/Library/LaunchAgents/${label}.plist"

if [[ -f "$plist_path" ]]; then
  launchctl bootout "gui/$(id -u)" "$plist_path" 2>/dev/null || true
  rm "$plist_path"
fi
echo "Daily Rincon Rent iMessage schedule removed."
