on run arguments
  if (count of arguments) is not 2 then error "Expected recipient and site URL"

  set recipientId to item 1 of arguments
  set siteUrl to item 2 of arguments
  set messageText to "Rincon Hill apartment prices were refreshed: " & siteUrl

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
