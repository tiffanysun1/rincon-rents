on run arguments
  if (count of arguments) is not 2 then error "Expected recipient and site URL"

  set recipientId to item 1 of arguments
  set siteUrl to item 2 of arguments
  set messageText to "Rincon Hill apartment prices: " & siteUrl

  tell application "Messages"
    set iMessageAccount to first account whose service type is iMessage
    set recipientParticipant to participant recipientId of iMessageAccount
    send messageText to recipientParticipant
  end tell
end run
