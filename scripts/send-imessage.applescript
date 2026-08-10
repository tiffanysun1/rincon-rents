on run arguments
  if (count of arguments) is less than 2 or (count of arguments) is greater than 3 then error "Expected recipient, site URL, and optional market summary"

  set recipientId to item 1 of arguments
  set siteUrl to item 2 of arguments
  set marketSummary to "Rincon Hill apartment prices were refreshed."
  if (count of arguments) is 3 then set marketSummary to item 3 of arguments
  set messageText to marketSummary & return & "View listings: " & siteUrl

  with timeout of 45 seconds
    tell application "Messages"
      launch
      delay 2
      set messageAccount to first account whose service type is iMessage
      set recipientParticipant to participant recipientId of messageAccount
      send messageText to recipientParticipant
    end tell
  end timeout
end run
