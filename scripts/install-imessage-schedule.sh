#!/bin/zsh
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 +14155551212 https://username.github.io/rincon-rents/"
  exit 1
fi

recipient="$1"
site_url="$2"
if [[ ! "$recipient" =~ '^\+[0-9]{8,15}$' ]]; then
  echo "Recipient must use E.164 format, for example +14155551212."
  exit 1
fi
if [[ ! "$site_url" =~ '^https://[^[:space:]]+$' ]]; then
  echo "Site URL must be an https:// address."
  exit 1
fi

user_home="${HOME}"
support_dir="${user_home}/Library/Application Support/Rincon Rent"
launch_agents_dir="${user_home}/Library/LaunchAgents"
label="com.rincon-rent.daily-link"
plist_path="${launch_agents_dir}/${label}.plist"
script_dir="${0:A:h}"
installed_script="${support_dir}/send-imessage.applescript"

mkdir -p "$support_dir" "$launch_agents_dir"
cp "${script_dir}/send-imessage.applescript" "$installed_script"
chmod 600 "$installed_script"

cat > "$plist_path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/osascript</string>
    <string>${installed_script}</string>
    <string>${recipient}</string>
    <string>${site_url}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>8</integer>
    <key>Minute</key>
    <integer>30</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${support_dir}/message.log</string>
  <key>StandardErrorPath</key>
  <string>${support_dir}/message-error.log</string>
</dict>
</plist>
PLIST

chmod 600 "$plist_path"
plutil -lint "$plist_path"
launchctl bootout "gui/$(id -u)" "$plist_path" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$plist_path"

echo "Daily iMessage scheduled for 8:30 AM local time."
echo "Run this once to test: /usr/bin/osascript '$installed_script' '$recipient' '$site_url'"
