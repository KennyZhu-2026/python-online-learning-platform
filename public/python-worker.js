/* global importScripts, loadPyodide */

const PYODIDE_VERSION = "314.0.2";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let pyodide;
let inputQueue = [];

async function initialize() {
  try {
    importScripts(`${PYODIDE_BASE}pyodide.js`);
    pyodide = await loadPyodide({
      indexURL: PYODIDE_BASE,
      stdout: (text) => self.postMessage({ type: "stdout", text: `${text}\n` }),
      stderr: (text) => self.postMessage({ type: "stderr", text: `${text}\n` }),
    });
    pyodide.setStdin({
      stdin: () => {
        const value = inputQueue.shift() ?? "";
        self.postMessage({ type: "stdout", text: `${value}\n` });
        return value;
      },
    });
    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({ type: "load-error", text: String(error) });
  }
}

self.onmessage = async (event) => {
  if (event.data?.type !== "run" || !pyodide) return;
  inputQueue = Array.isArray(event.data.inputs) ? [...event.data.inputs] : [];
  try {
    await pyodide.loadPackagesFromImports(event.data.code);
    await pyodide.runPythonAsync(event.data.code);
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({ type: "error", text: String(error) });
  }
};

initialize();
