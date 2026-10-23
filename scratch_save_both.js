const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

  const res = await send('Runtime.evaluate', {
    expression: `
      (function() {
        openCockpitLandingModal('napoles');

        // Let Three.js render
        cp3d.renderer.render(cp3d.scene, cp3d.camera);

        const canvas3d = document.getElementById('cockpitCanvas');
        const canvas2d = document.getElementById('cockpitOverlayCanvas');

        return {
          c3d: canvas3d.toDataURL('image/png'),
          c2d: canvas2d.toDataURL('image/png')
        };
      })()
    `,
    returnByValue: true
  });

  const val = res.result.result.value;
  fs.writeFileSync('C:\\Users\\luciu\\Documents\\dev\\games\\canvas3d_clean.png', Buffer.from(val.c3d.split(',')[1], 'base64'));
  fs.writeFileSync('C:\\Users\\luciu\\Documents\\dev\\games\\canvas2d_clean.png', Buffer.from(val.c2d.split(',')[1], 'base64'));
  console.log('Saved both images!');

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
