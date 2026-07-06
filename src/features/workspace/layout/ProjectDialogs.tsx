import { projectManager, type ProjectManagerState } from "../../../core/project";
import { Button } from "../../../ui/primitives";

export function ProjectDialogs({
  projectState,
}: {
  readonly projectState: ProjectManagerState;
}) {
  return (
    <>
      {projectState.pendingNewProject && <NewProjectDialog />}
      {projectState.autosaveAvailable && !projectState.pendingNewProject && (
        <AutosaveRecoveryDialog />
      )}
    </>
  );
}

function NewProjectDialog() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="w-[420px] rounded-[24px] border border-arctic-border/10 bg-arctic-background/95 p-5 shadow-[0_24px_80px_rgb(0_0_0/0.45)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-muted">
          New Project
        </p>
        <h2 className="mt-2 text-lg font-black uppercase tracking-[0.08em] text-arctic-text">
          Save current work?
        </h2>
        <p className="mt-3 text-sm font-medium leading-6 text-arctic-muted">
          Save First downloads the current project and keeps it open. Use Discard
          only when you are ready to clear the workspace.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => projectManager.cancelNewProject()} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button onClick={() => projectManager.discardNewProject()} size="sm" variant="ghost">
            Discard
          </Button>
          <Button onClick={() => projectManager.saveBeforeNewProject()} size="sm" variant="primary">
            Save First
          </Button>
        </div>
      </div>
    </div>
  );
}

function AutosaveRecoveryDialog() {
  return (
    <div className="fixed bottom-5 right-5 z-40 w-[360px] rounded-[20px] border border-arctic-ice/15 bg-arctic-background/95 p-4 shadow-[0_20px_70px_rgb(0_0_0/0.42)] backdrop-blur-panel">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-muted">
        Autosave
      </p>
      <p className="mt-2 text-sm font-bold text-arctic-text">
        A previous autosave is available.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={() => projectManager.dismissAutosave()} size="sm" variant="ghost">
          Dismiss
        </Button>
        <Button onClick={() => projectManager.recoverAutosave()} size="sm" variant="primary">
          Recover
        </Button>
      </div>
    </div>
  );
}
