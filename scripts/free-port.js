const { execSync } = require("node:child_process");

const port = process.argv[2];

if (!port) {
  console.error("Usage: node scripts/free-port.js <port>");
  process.exit(1);
}

if (process.platform !== "win32") {
  console.log(`Skipping port cleanup for ${port} on ${process.platform}.`);
  process.exit(0);
}

const run = (command, options = {}) =>
  execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();

const getListeningPids = () => {
  try {
    const output = run(`netstat -ano -p tcp | findstr :${port}`);
    return [...new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.includes("LISTENING"))
        .map((line) => line.split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid))
    )];
  } catch {
    return [];
  }
};

const getProcessDetails = (pid) => {
  try {
    const output = run(`wmic process where processid=${pid} get ProcessId,ParentProcessId,CommandLine /format:list`);
    const details = {};

    for (const line of output.split(/\r?\n/)) {
      const [key, ...rest] = line.split("=");
      if (!key || !rest.length) continue;
      details[key.trim()] = rest.join("=").trim();
    }

    return {
      pid: details.ProcessId || String(pid),
      parentPid: details.ParentProcessId || null,
      commandLine: details.CommandLine || "",
    };
  } catch {
    return { pid: String(pid), parentPid: null, commandLine: "" };
  }
};

const killPidTree = (pid) => {
  try {
    run(`taskkill /PID ${pid} /T /F`);
    return true;
  } catch (error) {
    const stderr = error?.stderr?.toString?.() || "";
    if (stderr) {
      console.warn(stderr.trim());
    }
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const pids = getListeningPids();

  if (!pids.length) {
    console.log(`No TCP process found on port ${port}.`);
    return;
  }

  for (const pid of pids) {
    const details = getProcessDetails(pid);
    const targetPid = details.commandLine.includes("nodemon") && details.parentPid ? details.parentPid : pid;
    const success = killPidTree(targetPid);

    if (success) {
      console.log(`Stopped process ${targetPid} on port ${port}.`);
    } else {
      console.warn(`Could not stop process ${targetPid} on port ${port}.`);
    }
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await sleep(300);
    if (!getListeningPids().length) {
      console.log(`Port ${port} is free.`);
      return;
    }
  }

  console.error(`Port ${port} is still in use.`);
  process.exit(1);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
