import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hardwareAPI } from '@/services/hardwareAPI';

const HardwareDebug: React.FC = () => {
  const [weight, setWeight] = useState(0);
  const [lastWsAt, setLastWsAt] = useState<number | null>(null);
  const [pump, setPump] = useState(1);
  const [duration, setDuration] = useState(1000);
  const [log, setLog] = useState<string[]>([]);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    const unsub = hardwareAPI.onWeightUpdate((w) => {
      setWeight(w);
      setLastWsAt(Date.now());
    });
    const statusInt = setInterval(async () => {
      try {
        const s = await hardwareAPI.getStatus();
        setStatus(s);
      } catch (e) {
        // ignore
      }
    }, 3000);
    return () => {
      clearInterval(statusInt);
    };
  }, []);

  const addLog = (line: string) => setLog((l) => [new Date().toLocaleTimeString() + ' ' + line, ...l].slice(0, 200));

  const handleTare = async () => {
    try { await hardwareAPI.tareScale(); addLog('Tare OK'); } catch (e: any) { addLog('Tare ERR: ' + e?.message); }
  };
  const handleRead = async () => {
    try { const w = await hardwareAPI.getWeight(); addLog('Weight: ' + w); } catch (e: any) { addLog('Weight ERR: ' + e?.message); }
  };
  const handleActivate = async () => {
    addLog(`Activate pump ${pump} for ${duration}ms`);
    try { await hardwareAPI.activatePump(pump, duration); addLog('Activate OK'); } catch (e: any) { addLog('Activate ERR: ' + e?.message); }
  };
  const handleStart = async () => {
    addLog(`Start pump ${pump}`);
    try { await hardwareAPI.startPump(pump); addLog('Start OK'); } catch (e: any) { addLog('Start ERR: ' + e?.message); }
  };
  const handleStop = async () => {
    addLog(`Stop pump ${pump}`);
    try { await hardwareAPI.stopPump(pump); addLog('Stop OK'); } catch (e: any) { addLog('Stop ERR: ' + e?.message); }
  };

  // Raw WebSocket probe (bypasses app state to isolate issues)
  const [probeConnected, setProbeConnected] = useState(false);
  const [probeEvents, setProbeEvents] = useState<string[]>([]);
  const probeRef = useRef<WebSocket | null>(null);
  const addProbe = (line: string) => setProbeEvents((l) => [new Date().toLocaleTimeString() + ' ' + line, ...l].slice(0, 200));
  const probeConnect = () => {
    if (probeRef.current) return;
    const wsUrl = hardwareAPI.getBaseUrl().replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    probeRef.current = ws;
    ws.onopen = () => { setProbeConnected(true); addProbe('WS open'); };
    ws.onmessage = (e) => { addProbe('WS message: ' + String(e.data).slice(0, 120)); };
    ws.onerror = (e) => { addProbe('WS error'); };
    ws.onclose = (e) => { setProbeConnected(false); addProbe(`WS close code=${e.code} reason=${e.reason} clean=${e.wasClean}`); probeRef.current = null; };
  };
  const probeDisconnect = () => { try { probeRef.current?.close(); } catch {} finally { probeRef.current = null; setProbeConnected(false); } };

  const wsStaleness = lastWsAt ? Math.round((Date.now() - lastWsAt) / 1000) : null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Hardware Debug</h1>
        <p className="text-sm text-muted-foreground">Live weight stream, pump controls, and connection diagnostics.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="p-4 rounded-lg border border-card-border bg-card">
          <h2 className="font-medium mb-2">WebSocket</h2>
          <p className="text-sm">Last WS weight at: {lastWsAt ? new Date(lastWsAt).toLocaleTimeString() : '—'}</p>
          <p className="text-sm">WS staleness: {wsStaleness !== null ? `${wsStaleness}s` : '—'}</p>
          <p className="text-sm">Live weight: {weight}</p>
        </article>
        <article className="p-4 rounded-lg border border-card-border bg-card">
          <h2 className="font-medium mb-2">Status</h2>
          <p className="text-sm">Status: {status?.status ?? '—'}</p>
          <p className="text-sm">Relay: {String(status?.relay)}</p>
          <p className="text-sm">Scale: {String(status?.scale)}</p>
          <p className="text-sm">WiFi: {String(status?.wifi)}</p>
        </article>
        <article className="p-4 rounded-lg border border-card-border bg-card">
          <h2 className="font-medium mb-2">Scale</h2>
          <div className="flex gap-2">
            <Button onClick={handleTare}>Tare</Button>
            <Button variant="outline" onClick={handleRead}>Read once</Button>
          </div>
        </article>
      </section>

      <section className="p-4 rounded-lg border border-card-border bg-card space-y-3">
        <h2 className="font-medium">Pump Control</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm">Pump</label>
            <Input type="number" value={pump} min={1} max={8} className="w-20" onChange={(e) => setPump(parseInt(e.target.value || '1', 10))} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">Duration (ms)</label>
            <Input type="number" value={duration} className="w-28" onChange={(e) => setDuration(parseInt(e.target.value || '1000', 10))} />
          </div>
          <Button onClick={handleActivate}>Activate</Button>
          <Button variant="secondary" onClick={handleStart}>Start</Button>
          <Button variant="destructive" onClick={handleStop}>Stop</Button>
        </div>
      </section>

      <section className="p-4 rounded-lg border border-card-border bg-card space-y-2">
        <h2 className="font-medium">Raw WS Probe</h2>
        <div className="flex items-center gap-2">
          <Button onClick={probeConnect} disabled={probeConnected}>Connect</Button>
          <Button variant="outline" onClick={probeDisconnect} disabled={!probeConnected}>Disconnect</Button>
          <span className="text-sm text-muted-foreground">State: {probeConnected ? 'connected' : 'disconnected'}</span>
        </div>
        <div className="h-40 overflow-auto text-xs font-mono whitespace-pre-wrap bg-muted/30 p-2 rounded">
          {probeEvents.map((l, i) => (<div key={i}>{l}</div>))}
        </div>
      </section>

      <section className="p-4 rounded-lg border border-card-border bg-card">
        <h2 className="font-medium mb-2">Logs</h2>
        <div className="h-64 overflow-auto text-xs font-mono whitespace-pre-wrap bg-muted/30 p-2 rounded">
          {log.map((l, i) => (<div key={i}>{l}</div>))}
        </div>
      </section>
    </main>
  );
};

export default HardwareDebug;
