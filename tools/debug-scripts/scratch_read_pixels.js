const { spawn } = require('child_process');
const http = require('http');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/luciu/Documents/dev/games/games/elpatron.html';

async function main() {
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--no-sandbox',
    '--window-size=1200,900',
    htmlUrl
  ], { stdio: 'ignore' });

  for (let i = 0; i < 30; i++) {
    try {
      await new Promise(r => setTimeout(r, 200));
      versionData = await getJson('http://127.0.0.1:9222/json');
      if (versionData && versionData.length > 0) break;
    } catch(e) {}
  }

  const target = versionData.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idCounter = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  const evalRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        openCockpitLandingModal('napoles');
        // Let's render one frame explicitly
        renderCockpitVisuals(70, 280, -500, 3.0);

        const canvas = document.getElementById('cockpitCanvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
        if (!gl) return { error: 'No GL context' };

        // Sample a few pixels across the canvas
        const pixels = new Uint8Array(4 * 10 * 10);
        gl.readPixels(470, 210, 10, 10, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        const samples = [];
        for (let i = 0; i < 10; i++) {
          const idx = i * 4;
          samples.push([pixels[idx], pixels[idx+1], pixels[idx+2], pixels[idx+3]]);
        }

        return {
          viewport: gl.getParameter(gl.VIEWPORT),
          clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
          sampleCenterPixels: samples,
          canvasStyle: {
            width: canvas.style.width,
            height: canvas.style.height,
            display: window.getComputedStyle(canvas).display,
            visibility: window.getComputedStyle(canvas).visibility,
            opacity: window.getComputedStyle(canvas).opacity,
            zIndex: window.getComputedStyle(canvas).zIndex
          },
          overlayStyle: {
            width: document.getElementById('cockpitOverlayCanvas').style.width,
            height: document.getElementById('cockpitOverlayCanvas').style.height,
            display: window.getComputedStyle(document.getElementById('cockpitOverlayCanvas')).display,
            visibility: window.getComputedStyle(document.getElementById('cockpitOverlayCanvas')).visibility,
            opacity: window.getComputedStyle(document.getElementById('cockpitOverlayCanvas')).opacity,
            zIndex: window.getComputedStyle(document.getElementById('cockpitOverlayCanvas')).zIndex
          }
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Result:', JSON.stringify(evalRes, null, 2));

  ws.close();
  chromeProc.kill();
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

main().catch(console.error);
