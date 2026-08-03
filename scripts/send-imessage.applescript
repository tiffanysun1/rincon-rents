on run arguments
  if (count of arguments) is not 2 then error "Expected recipient and site URL"

  set recipientId to item 1 of arguments
  set siteUrl to item 2 of arguments
  set messageText to "Rincon Hill apartment prices: " & siteUrl

  tell application "Messages"
    set recipientParticipant to missing value
    repeat with candidateAccount in accounts
      set matchingParticipants to participants of candidateAccount whose handle is recipientId
      if (count of matchingParticipants) > 0 then
        set recipientParticipant to first item of matchingParticipants
        exit repeat
      end if
    end repeat

    if recipientParticipant is missing value then
      error "No Messages participant found for " & recipientId
    end if
    send messageText to recipientParticipant
  end tell
end run
