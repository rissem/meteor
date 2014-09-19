var inspector = require("node-inspector");
var inspectorBinPath = require.resolve("node-inspector/bin/inspector");
var spawn = require("child_process").spawn;
var debugPortToProcess = [];
var hasOwn = Object.prototype.hasOwnProperty;

function start(debugPort) {
  debugPort = +(debugPort || 5858);

  if (hasOwn.call(debugPortToProcess, debugPort)) {
    return debugPortToProcess[debugPort];
  }

  var proc = spawn(process.execPath, [
    inspectorBinPath,
    "--web-port", "0", // Zero means "pick a random open port."
    "--debug-port", "" + debugPort
  ]);

  proc.stdout.pipe(process.stdout);
  proc.stderr.pipe(process.stderr);

  proc.on("exit", function(code) {
    // Restart the process if it died without us explicitly stopping it.
    if (debugPortToProcess[debugPort] === proc) {
      delete debugPortToProcess[debugPort];
      start(debugPort);
    }
  });

  debugPortToProcess[debugPort] = proc;

  return proc;
}
exports.start = start;

function stop(debugPort) {
  debugPort = +(debugPort || 5858);

  var proc = debugPortToProcess[debugPort];
  if (proc.kill) {
    console.error("killed " + proc.pid);
    proc.kill();
  }

  delete debugPortToProcess[debugPort];
}
exports.stop = stop;

function killAll(code) {
  for (var debugPort in debugPortToProcess) {
    stop(debugPort);
  }
  debugPortToProcess.length = 0;
  process.exit(~~code);
}

process.on("exit", killAll);
process.on("SIGINT", killAll);
process.on("SIGTERM", killAll);
