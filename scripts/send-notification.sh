#!/bin/zsh
set -u

if [[ $# -ne 4 ]]; then
  echo "Usage: $0 APPLESCRIPT RECIPIENT SITE_URL STATE_DIR" >&2
  exit 2
fi

message_script="$1"
recipient="$2"
site_url="$3"
state_dir="$4"
stamp_file="${state_dir}/last-successful-message-date"
today="$(/bin/date +%F)"

if [[ -f "$stamp_file" && "$(<"$stamp_file")" == "$today" ]]; then
  echo "Daily apartment notification already sent for ${today}."
  exit 0
fi

/usr/bin/open -gja Messages >/dev/null 2>&1 || true
for attempt in {1..6}; do
  if /usr/bin/osascript "$message_script" "$recipient" "$site_url"; then
    print -r -- "$today" > "$stamp_file"
    echo "Apartment notification sent on attempt ${attempt} at $(/bin/date)."
    exit 0
  fi
  echo "Messages attempt ${attempt} failed at $(/bin/date); retrying." >&2
  /bin/sleep 30
  /usr/bin/open -gja Messages >/dev/null 2>&1 || true
done

echo "Apartment notification failed after six attempts." >&2
exit 1
