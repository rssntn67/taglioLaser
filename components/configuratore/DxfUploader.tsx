'use client';

import { useState, DragEvent, ChangeEvent } from 'react';
import type { DxfParseResult } from '@/types';

interface Props {
  onParsed: (result: DxfParseResult) => void;
  onError: (msg: string) => void;
}

export function DxfUploader({ onParsed, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.dxf')) {
      onError('Il file deve essere in formato DXF');
      return;
    }
    setLoading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch('/api/dxf/parse', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? 'Errore durante il parsing');
        setFileName(null);
      } else {
        onParsed(data as DxfParseResult);
      }
    } catch {
      onError('Errore di rete');
      setFileName(null);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">File DXF</p>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed h-28 cursor-pointer transition-colors ${
          dragging ? 'border-ink bg-mist' : 'border-border hover:border-ink'
        }`}
      >
        <input type="file" accept=".dxf" onChange={handleChange} className="hidden" />
        {loading ? (
          <span className="text-sm text-gray-400">Analisi in corso...</span>
        ) : fileName ? (
          <span className="text-sm font-semibold text-ink">✓ {fileName}</span>
        ) : (
          <>
            <span className="text-2xl mb-1">📁</span>
            <span className="text-sm text-gray-400">Trascina il file DXF qui</span>
            <span className="text-xs text-gray-300">oppure clicca per selezionarlo</span>
          </>
        )}
      </label>
    </div>
  );
}
