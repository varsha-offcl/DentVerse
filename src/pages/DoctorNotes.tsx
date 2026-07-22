import * as React from "react";
import { StickyNote } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import NotesPanel from "@/components/notes/NotesPanel";

export default function DoctorNotes() {
  const { doctorNotes, loadDoctorNotes, addDoctorNote, updateDoctorNote, togglePinDoctorNote, deleteDoctorNote } =
    useAppState();

  React.useEffect(() => {
    void loadDoctorNotes();
  }, [loadDoctorNotes]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <StickyNote className="h-6 w-6 text-primary" /> Notes
        </h1>
        <p className="text-sm text-muted-foreground">
          Your own reminders and scratchpad — private to you, not tied to any patient.
        </p>
      </div>

      <NotesPanel
        notes={doctorNotes}
        emptyMessage="No notes yet — jot down a reminder, or dictate one."
        onAdd={addDoctorNote}
        onUpdate={updateDoctorNote}
        onTogglePin={togglePinDoctorNote}
        onDelete={deleteDoctorNote}
      />
    </div>
  );
}
