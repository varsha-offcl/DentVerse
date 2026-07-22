import * as React from "react";
import { Mic, Square, Pin, PinOff, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { callOrchestrator } from "@/lib/orchestrator";

export interface NoteLike {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesPanelProps<T extends NoteLike> {
  notes: T[];
  onAdd: (content: string) => Promise<T>;
  onUpdate: (noteId: string, content: string) => Promise<T>;
  onTogglePin: (noteId: string, pinned: boolean) => Promise<T>;
  onDelete: (noteId: string) => Promise<void>;
  emptyMessage?: string;
  addButtonLabel?: string;
}

function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}

function notePreview(content: string, max = 90): string {
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

function sortNotes<T extends NoteLike>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * Shared by the per-patient Notes widget and the doctor's personal Notes
 * page — same composer (type or dictate), same list/pin/edit/delete
 * behavior. Callers own persistence (via the on* callbacks) and scoping
 * (which patient, or "just this doctor"); this component owns the UI and
 * the recording -> transcription flow.
 */
export default function NotesPanel<T extends NoteLike>({
  notes,
  onAdd,
  onUpdate,
  onTogglePin,
  onDelete,
  emptyMessage = "No notes yet.",
  addButtonLabel = "New Note",
}: NotesPanelProps<T>) {
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [composerContent, setComposerContent] = React.useState("");
  const [composerSaving, setComposerSaving] = React.useState(false);
  const [composerError, setComposerError] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [recordError, setRecordError] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const [openNote, setOpenNote] = React.useState<T | null>(null);
  const [editingContent, setEditingContent] = React.useState<string | null>(null);
  const [detailSaving, setDetailSaving] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const sorted = sortNotes(notes);

  const openComposer = () => {
    setComposerContent("");
    setComposerError(null);
    setRecordError(null);
    setComposerOpen(true);
  };

  // Voice notes reuse the same orchestrator transcription call Voice-to-Chart
  // uses — just the STT step, no SOAP structuring — and drop the transcript
  // into the composer for review/edit before saving.
  const transcribeAndFill = async (blob: Blob) => {
    setTranscribing(true);
    setRecordError(null);
    try {
      const extension = blob.type.split(";")[0].split("/")[1] || "webm";
      const form = new FormData();
      form.append("audio", blob, `note.${extension}`);
      const { transcript } = await callOrchestrator<{ transcript: string }>("/internal/voice-to-chart/transcribe", {
        method: "POST",
        body: form,
      });
      setComposerContent((prev) => (prev.trim() ? `${prev}\n${transcript}` : transcript));
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : "Could not transcribe the recording.");
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void transcribeAndFill(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setRecordError(
        err instanceof Error ? `Couldn't access the microphone: ${err.message}` : "Couldn't access the microphone."
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSaveNewNote = async () => {
    if (!composerContent.trim()) return;
    setComposerSaving(true);
    setComposerError(null);
    try {
      await onAdd(composerContent.trim());
      setComposerOpen(false);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : "Could not save this note.");
    } finally {
      setComposerSaving(false);
    }
  };

  const openForView = (note: T) => {
    setOpenNote(note);
    setEditingContent(null);
    setDetailError(null);
  };

  const startEditingNote = () => {
    if (!openNote) return;
    setEditingContent(openNote.content);
    setDetailError(null);
  };

  const handleSaveEdit = async () => {
    if (!openNote || editingContent === null) return;
    setDetailSaving(true);
    setDetailError(null);
    try {
      const updated = await onUpdate(openNote.id, editingContent.trim());
      setOpenNote(updated);
      setEditingContent(null);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not save these changes.");
    } finally {
      setDetailSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!openNote) return;
    setDetailSaving(true);
    setDetailError(null);
    try {
      const updated = await onTogglePin(openNote.id, !openNote.pinned);
      setOpenNote(updated);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not update this note's pin status.");
    } finally {
      setDetailSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!openNote) return;
    setDetailSaving(true);
    setDetailError(null);
    try {
      await onDelete(openNote.id);
      setOpenNote(null);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not delete this note.");
      setDetailSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openComposer}>
          <Plus className="h-3.5 w-3.5" /> {addButtonLabel}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((n) => (
            <button
              key={n.id}
              onClick={() => openForView(n)}
              className="flex w-full items-start justify-between gap-3 rounded-lg border border-border p-3.5 text-left hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{notePreview(n.content)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNoteTimestamp(n.createdAt)}</p>
              </div>
              {n.pinned && (
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Pin className="h-3 w-3" /> Pinned
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* New note composer — type, or dictate and review before saving */}
      <Dialog open={composerOpen} onOpenChange={(open) => !open && !composerSaving && setComposerOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{addButtonLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={composerContent}
              onChange={(e) => setComposerContent(e.target.value)}
              placeholder="Type a note, or use the microphone to dictate one..."
              rows={5}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={recording ? "destructive" : "outline"}
                size="sm"
                onClick={() => (recording ? stopRecording() : void startRecording())}
                disabled={transcribing}
              >
                {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                {recording ? "Stop Recording" : "Dictate"}
              </Button>
              {transcribing && <span className="text-xs text-muted-foreground">Transcribing...</span>}
            </div>
            {recordError && <p className="text-sm text-destructive">{recordError}</p>}
            {composerError && <p className="text-sm text-destructive">{composerError}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setComposerOpen(false)} disabled={composerSaving}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveNewNote}
                disabled={composerSaving || transcribing || !composerContent.trim()}
              >
                {composerSaving ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note detail — view, edit, pin/unpin, delete */}
      <Dialog open={!!openNote} onOpenChange={(open) => !open && !detailSaving && setOpenNote(null)}>
        <DialogContent>
          {openNote && editingContent === null && (
            <>
              <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
                <DialogTitle className="flex items-center gap-2">
                  {openNote.pinned && <Pin className="h-4 w-4 text-primary" />}
                  Note
                </DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground">
                {formatNoteTimestamp(openNote.createdAt)}
                {openNote.updatedAt !== openNote.createdAt ? " (edited)" : ""}
              </p>
              <p className="whitespace-pre-wrap text-sm">{openNote.content}</p>
              {detailError && <p className="text-sm text-destructive">{detailError}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={startEditingNote} disabled={detailSaving}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleTogglePin} disabled={detailSaving}>
                  {openNote.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                  {openNote.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={detailSaving} className="ml-auto">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </>
          )}
          {openNote && editingContent !== null && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} rows={5} />
                {detailError && <p className="text-sm text-destructive">{detailError}</p>}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" className="flex-1" onClick={() => setEditingContent(null)} disabled={detailSaving}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSaveEdit} disabled={detailSaving || !editingContent.trim()}>
                    {detailSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
