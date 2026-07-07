export type TikzPanelCodeState = {
  readonly autoUpdate: boolean;
  readonly draftCode: string;
  readonly editable: boolean;
  readonly generatedCode: string;
  readonly manualEditsPending: boolean;
};

export function shouldFollowGeneratedTikz({
  autoUpdate,
  editable,
  manualEditsPending,
}: Pick<TikzPanelCodeState, "autoUpdate" | "editable" | "manualEditsPending">): boolean {
  return autoUpdate || !editable || !manualEditsPending;
}

export function getTikzPanelDisplayedCode(state: TikzPanelCodeState): string {
  return shouldFollowGeneratedTikz(state) ? state.generatedCode : state.draftCode;
}

export function getTikzPanelStatusText({
  autoUpdate,
  liveSyncEnabled,
  liveSyncStatus,
  manualEditsPending,
}: {
  readonly autoUpdate: boolean;
  readonly liveSyncEnabled: boolean;
  readonly liveSyncStatus: string;
  readonly manualEditsPending: boolean;
}): string {
  if (manualEditsPending) {
    return liveSyncEnabled ? `Manual edits pending - Live ${liveSyncStatus}` : "Manual edits pending";
  }

  if (autoUpdate) {
    return "Geometry -> TikZ";
  }

  return liveSyncEnabled ? `Live ${liveSyncStatus}` : "Live off";
}
