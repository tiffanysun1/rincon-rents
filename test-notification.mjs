import assert from "node:assert/strict";
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

async function executable(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
  await chmod(path, 0o700);
}

const temporaryRoot = await mkdtemp(join(tmpdir(), "rincon-notification-test-"));
try {
  const binDir = join(temporaryRoot, "bin");
  const stateDir = join(temporaryRoot, "state");
  const readyFile = join(temporaryRoot, "ready-state");
  const eventLog = join(temporaryRoot, "events.log");
  const sendCount = join(temporaryRoot, "send-count");
  const summaryArgument = join(temporaryRoot, "summary-argument");
  await mkdir(stateDir, { recursive: true });
  await writeFile(readyFile, "locked\n");

  const probe = join(binDir, "session-probe");
  const fakeSleep = join(binDir, "sleep");
  const fakeOpen = join(binDir, "open");
  const fakeCurl = join(binDir, "curl");
  const fakeOsascript = join(binDir, "osascript");
  await executable(probe, `#!/bin/sh
state=$(tr -d '\\n' < "$RINCON_TEST_READY_FILE")
printf 'probe:%s\\n' "$state" >> "$RINCON_TEST_EVENT_LOG"
[ "$state" = "ready" ]
`);
  await executable(fakeSleep, `#!/bin/sh
printf 'sleep\\n' >> "$RINCON_TEST_EVENT_LOG"
printf 'ready\\n' > "$RINCON_TEST_READY_FILE"
`);
  await executable(fakeOpen, `#!/bin/sh
printf 'open\\n' >> "$RINCON_TEST_EVENT_LOG"
`);
  await executable(fakeCurl, `#!/bin/sh
printf 'summary\\n' >> "$RINCON_TEST_EVENT_LOG"
printf 'Rincon Hill daily update: 2 new homes.'
`);
  await executable(fakeOsascript, `#!/bin/sh
count=0
if [ -f "$RINCON_TEST_SEND_COUNT" ]; then count=$(cat "$RINCON_TEST_SEND_COUNT"); fi
count=$((count + 1))
printf '%s\\n' "$count" > "$RINCON_TEST_SEND_COUNT"
printf 'send:%s\\n' "$count" >> "$RINCON_TEST_EVENT_LOG"
printf '%s' "$4" > "$RINCON_TEST_SUMMARY_ARGUMENT"
if [ "$count" -eq 1 ]; then exit 1; fi
`);

  const wrapper = resolve("scripts/send-notification.sh");
  const shell = existsSync("/bin/bash") ? "/bin/bash" : "/bin/zsh";
  const environment = {
    ...process.env,
    RINCON_SESSION_PROBE: probe,
    RINCON_SLEEP_BIN: fakeSleep,
    RINCON_OPEN_BIN: fakeOpen,
    RINCON_CURL_BIN: fakeCurl,
    RINCON_OSASCRIPT_BIN: fakeOsascript,
    RINCON_WAIT_SECONDS: "0",
    RINCON_RETRY_SECONDS: "0",
    RINCON_FAILURE_BACKOFF_SECONDS: "0",
    RINCON_SEND_ATTEMPTS: "3",
    RINCON_TEST_READY_FILE: readyFile,
    RINCON_TEST_EVENT_LOG: eventLog,
    RINCON_TEST_SEND_COUNT: sendCount,
    RINCON_TEST_SUMMARY_ARGUMENT: summaryArgument,
  };
  const argumentsList = [wrapper, join(temporaryRoot, "message.applescript"), "+14155551212", "https://example.com/rincon-rents/", stateDir];
  const firstRun = spawnSync(shell, argumentsList, { encoding: "utf8", env: environment, timeout: 5_000 });
  assert.equal(firstRun.status, 0, firstRun.stderr || firstRun.error?.message);
  assert.match(firstRun.stdout, /asleep, locked, or inactive; waiting/);
  assert.match(firstRun.stdout, /sent on attempt 2/);
  assert.deepEqual(
    (await readFile(eventLog, "utf8")).trim().split("\n"),
    ["probe:locked", "sleep", "probe:ready", "summary", "open", "send:1", "sleep", "open", "send:2"],
    "Messages must not be opened or scripted until the GUI session is ready",
  );
  assert.equal(await readFile(summaryArgument, "utf8"), "Rincon Hill daily update: 2 new homes.");

  const today = spawnSync("/bin/date", ["+%F"], { encoding: "utf8" }).stdout.trim();
  assert.equal((await readFile(join(stateDir, "last-successful-message-date"), "utf8")).trim(), today);
  const eventsAfterSuccess = await readFile(eventLog, "utf8");
  const secondRun = spawnSync(shell, argumentsList, { encoding: "utf8", env: environment, timeout: 5_000 });
  assert.equal(secondRun.status, 0, secondRun.stderr || secondRun.error?.message);
  assert.match(secondRun.stdout, /already sent/);
  assert.equal(await readFile(eventLog, "utf8"), eventsAfterSuccess, "the date stamp must prevent duplicate messages");

  console.log("Validated sleep/lock deferral, retry, success stamping, and duplicate prevention.");
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
