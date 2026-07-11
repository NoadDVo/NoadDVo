const fs = require('fs');
const file = 'src/app/store/uiStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'export type ResolvedThemeMode = Exclude<ThemeMode, "system">;',
  'export type ResolvedThemeMode = Exclude<ThemeMode, "system">;\nexport type AppTheme = "theme1" | "theme2";'
);
code = code.replace(
  'readonly theme: ThemeMode;',
  'readonly appTheme: AppTheme;\n  readonly theme: ThemeMode;'
);
code = code.replace(
  'readonly tikzMode: TikzMode;',
  'readonly tikzMode: TikzMode;\n  readonly inspectorLocked: boolean;\n  readonly lockedObjectId: string | null;'
);
code = code.replace(
  'readonly setTheme: (theme: ThemeMode) => void;',
  'readonly setAppTheme: (theme: AppTheme) => void;\n  readonly setTheme: (theme: ThemeMode) => void;'
);
code = code.replace(
  'readonly setTikzMode: (mode: TikzMode) => void;',
  'readonly setTikzMode: (mode: TikzMode) => void;\n  readonly setInspectorLocked: (locked: boolean) => void;\n  readonly setLockedObjectId: (id: string | null) => void;'
);
code = code.replace(
  'activeSidebar: "tools",',
  'activeSidebar: "tools",\n  appTheme: "theme1" as AppTheme,'
);
code = code.replace(
  'tikzMode: "academic",',
  'tikzMode: "academic",\n  inspectorLocked: false,\n  lockedObjectId: null,'
);
code = code.replace(
  '| "activeSidebar"',
  '| "activeSidebar"\n  | "appTheme"'
);
code = code.replace(
  '| "tikzMode"',
  '| "tikzMode"\n  | "inspectorLocked"\n  | "lockedObjectId"'
);
code = code.replace(
  'theme: readStoredTheme(),',
  'theme: readStoredTheme(),\n  setAppTheme: (appTheme) => {\n    set({ appTheme });\n    if (typeof window !== "undefined") {\n      window.localStorage.setItem("ndv.appTheme", appTheme);\n    }\n  },'
);
code = code.replace(
  'setTikzMode: (tikzMode) => {\n    set({ tikzMode });\n  },',
  'setTikzMode: (tikzMode) => {\n    set({ tikzMode });\n  },\n  setInspectorLocked: (inspectorLocked) => {\n    set({ inspectorLocked });\n  },\n  setLockedObjectId: (lockedObjectId) => {\n    set({ lockedObjectId });\n  },'
);

fs.writeFileSync(file, code);
console.log("Done");
