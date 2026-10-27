#!/usr/bin/env node
/* ─── tools/crown-relay.js ───────────────────────────────────────────────────
 * THE CROWN RELAY · Mind Monitor OSC → WebSocket on your own LAN.
 *
 * Canon §9.9's top rung without a native build: Mind Monitor fires OSC over
 * UDP, this listens for it and re-serves each sample as JSON over WebSocket,
 * and lib/crownLive.ts reads that from the phone. Nothing leaves the network.
 *
 * RUN IT:   node tools/crown-relay.js
 * THEN:     Mind Monitor → Settings → OSC Stream Target
 *             IP   = this machine's LAN address (printed on start)
 *             Port = 5000
 *           Recording Interval → Constant.
 * IN AA2:   point the Crown at  ws://<that same IP>:8787
 *
 * NO DEPENDENCIES. Node's own dgram and a hand-rolled WebSocket frame writer,
 * so there is nothing to npm install and nothing to keep up to date.
 * ─────────────────────────────────────────────────────────────────────────── */
const dgram = require('dgram');
const http = require('http');
const crypto = require('crypto');
const os = require('os');

const UDP_PORT = Number(process.env.CROWN_UDP_PORT || 5000);
const WS_PORT  = Number(process.env.CROWN_WS_PORT  || 8787);

/* ── minimal OSC decode · Mind Monitor sends /muse/... with f or i args ───── */
const pad4 = n => n + ((4 - (n % 4)) % 4);
function decodeOSC(buf) {
  let i = 0;
  const readStr = () => {
    const end = buf.indexOf(0, i);
    const s = buf.toString('ascii', i, end);
    i = pad4(end + 1 - i) + i;
    return s;
  };
  const address = readStr();
  if (!address.startsWith('/')) return null;
  let tags = '';
  if (buf[i] === 0x2c) tags = readStr().slice(1);
  const args = [];
  for (const t of tags) {
    if (t === 'f') { args.push(buf.readFloatBE(i)); i += 4; }
    else if (t === 'i') { args.push(buf.readInt32BE(i)); i += 4; }
    else if (t === 'd') { args.push(buf.readDoubleBE(i)); i += 8; }
    else if (t === 's') { args.push(readStr()); }
    else { break; }
  }
  return { address, args };
}

/* ── the live sample, rebuilt from the separate OSC addresses ─────────────── */
const avg = a => (a && a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
let cur = { delta: null, theta: null, alpha: null, beta: null, gamma: null,
            contact: null, heartRate: null, headbandOn: true, battery: null };

function onOSC(m) {
  const a = m.address;
  if (a === '/muse/elements/delta_absolute') cur.delta = avg(m.args);
  else if (a === '/muse/elements/theta_absolute') cur.theta = avg(m.args);
  else if (a === '/muse/elements/alpha_absolute') cur.alpha = avg(m.args);
  else if (a === '/muse/elements/beta_absolute')  cur.beta  = avg(m.args);
  else if (a === '/muse/elements/gamma_absolute') cur.gamma = avg(m.args);
  else if (a === '/muse/elements/horseshoe') {
    // HSI: 1 good · 2 ok · 4 bad, one per channel. Good only when ALL four are,
    // because a band average is only as honest as its worst electrode.
    cur.contact = m.args.length ? (m.args.every(v => v <= 1) ? 100 : 0) : null;
  }
  else if (a === '/muse/elements/touching_forehead') cur.headbandOn = Number(m.args[0]) >= 1;
  else if (a === '/muse/batt') cur.battery = Number(m.args[0]) / 100;
  else if (a.includes('hrv') || a.includes('heart')) cur.heartRate = Number(m.args[0]) || null;
  else return;

  if (cur.delta != null && cur.theta != null && cur.alpha != null && cur.beta != null && cur.gamma != null) {
    broadcast({ at: Date.now(), ...cur });
  }
}

/* ── the smallest possible WebSocket server ───────────────────────────────── */
const clients = new Set();
function frame(str) {
  const p = Buffer.from(str);
  if (p.length < 126) return Buffer.concat([Buffer.from([0x81, p.length]), p]);
  const h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(p.length, 2);
  return Buffer.concat([h, p]);
}
function broadcast(obj) {
  const f = frame(JSON.stringify(obj));
  for (const s of clients) { try { s.write(f); } catch { clients.delete(s); } }
}
const server = http.createServer((_, res) => { res.writeHead(200); res.end('AA2 crown relay\n'); });
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
               'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  clients.add(socket);
  socket.on('close', () => clients.delete(socket));
  socket.on('error', () => clients.delete(socket));
  console.log(`[relay] AA2 connected · ${clients.size} client(s)`);
});

const udp = dgram.createSocket('udp4');
udp.on('message', b => { const m = decodeOSC(b); if (m) onOSC(m); });
udp.bind(UDP_PORT);

const ips = Object.values(os.networkInterfaces()).flat()
  .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
server.listen(WS_PORT, () => {
  console.log('─────────────────────────────────────────────');
  console.log(' AA2 CROWN RELAY · the raw never touches disk');
  console.log('─────────────────────────────────────────────');
  console.log(` Mind Monitor OSC target : ${ips[0] || '<this machine>'} : ${UDP_PORT}`);
  console.log(` AA2 Crown stream URL    : ws://${ips[0] || '<this machine>'}:${WS_PORT}`);
  console.log(' Recording Interval → Constant. Watch HSI before you sit.');
});
