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
date_bin="${RINCON_DATE_BIN:-/bin/date}"
sleep_bin="${RINCON_SLEEP_BIN:-/bin/sleep}"
open_bin="${RINCON_OPEN_BIN:-/usr/bin/open}"
osascript_bin="${RINCON_OSASCRIPT_BIN:-/usr/bin/osascript}"
curl_bin="${RINCON_CURL_BIN:-/usr/bin/curl}"
ioreg_bin="${RINCON_IOREG_BIN:-/usr/sbin/ioreg}"
plutil_bin="${RINCON_PLUTIL_BIN:-/usr/bin/plutil}"
pmset_bin="${RINCON_PMSET_BIN:-/usr/bin/pmset}"
awk_bin="${RINCON_AWK_BIN:-/usr/bin/awk}"
wait_seconds="${RINCON_WAIT_SECONDS:-60}"
retry_seconds="${RINCON_RETRY_SECONDS:-30}"
failure_backoff_seconds="${RINCON_FAILURE_BACKOFF_SECONDS:-300}"
send_attempts="${RINCON_SEND_ATTEMPTS:-3}"
today="$("$date_bin" +%F)"

session_is_ready() {
  if [[ -n "${RINCON_SESSION_PROBE:-}" ]]; then
    "$RINCON_SESSION_PROBE"
    return $?
  fi

  local console_locked user_active
  console_locked="$("$ioreg_bin" -n Root -d1 -a 2>/dev/null | "$plutil_bin" -extract IOConsoleLocked raw -o - - 2>/dev/null)"
  user_active="$("$pmset_bin" -g assertions 2>/dev/null | "$awk_bin" '$1 == "UserIsActive" { print $2; exit }')"
  [[ "$console_locked" == "false" && "$user_active" == "1" ]]
}

if [[ -f "$stamp_file" && "$(<"$stamp_file")" == "$today" ]]; then
  echo "Daily apartment notification already sent for ${today}."
  exit 0
fi

waiting_logged=0
while [[ "$("$date_bin" +%F)" == "$today" ]]; do
  if ! session_is_ready; then
    if (( waiting_logged == 0 )); then
      echo "Mac is asleep, locked, or inactive; waiting to send the ${today} apartment notification."
      waiting_logged=1
    fi
    "$sleep_bin" "$wait_seconds"
    continue
  fi

  waiting_logged=0
  market_summary="${RINCON_MARKET_SUMMARY:-}"
  if [[ -z "$market_summary" ]]; then
    market_summary="$("$curl_bin" -fsSL --max-time 20 "${site_url%/}/market-summary.txt" 2>/dev/null)" || market_summary=""
  fi
  if [[ -z "$market_summary" ]]; then
    market_summary="Rincon Hill apartment prices were refreshed."
  fi
  "$open_bin" -gja Messages >/dev/null 2>&1 || true
  attempt=1
  while (( attempt <= send_attempts )); do
    if "$osascript_bin" "$message_script" "$recipient" "$site_url" "$market_summary"; then
      printf '%s\n' "$today" > "$stamp_file"
      echo "Apartment notification sent on attempt ${attempt} at $("$date_bin")."
      exit 0
    fi
    echo "Messages attempt ${attempt} failed at $("$date_bin")." >&2
    if (( attempt < send_attempts )); then
      "$sleep_bin" "$retry_seconds"
      "$open_bin" -gja Messages >/dev/null 2>&1 || true
    fi
    (( attempt += 1 ))
  done

  echo "Messages remained unavailable; retrying after the Mac stays awake." >&2
  "$sleep_bin" "$failure_backoff_seconds"
done

echo "The ${today} apartment notification expired before an awake, unlocked session was available." >&2
exit 1
