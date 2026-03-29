import { useState, useEffect, useCallback, useRef } from 'react';
import { NoteService } from '../services/NoteService';

export function useNote(questionId: number) {
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    NoteService.getNote(questionId).then((existing) => {
      if (!cancelled) {
        setNote(existing?.text || '');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [questionId]);

  const saveNote = useCallback((text: string) => {
    setNote(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      if (text.trim()) {
        await NoteService.saveNote(questionId, text);
      } else {
        await NoteService.deleteNote(questionId);
      }
      setSaving(false);
    }, 1000);
  }, [questionId]);

  const deleteNote = useCallback(async () => {
    setNote('');
    await NoteService.deleteNote(questionId);
  }, [questionId]);

  return { note, loading, saving, saveNote, deleteNote };
}
