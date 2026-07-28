import type { Language } from "../app/store/uiStore";

type TranslationKey =
  // Toolbar tools
  | "tool.select"
  | "tool.point"
  | "tool.line"
  | "tool.segment"
  | "tool.ray"
  | "tool.circle"
  | "tool.arc"
  | "tool.perpendicular"
  | "tool.parallel"
  | "tool.perpendicularBisector"
  | "tool.angleBisector"
  | "tool.midpoint"
  | "tool.intersect"
  | "tool.distance"
  | "tool.angle"
  | "tool.area"
  | "tool.polygon"
  | "tool.slider"
  | "tool.text"
  | "tool.delete"
  // Settings
  | "settings.title"
  | "settings.workspace"
  | "settings.appearance"
  | "settings.theme"
  | "settings.appTheme"
  | "settings.canvas"
  | "settings.grid"
  | "settings.snap"
  | "settings.tikz"
  | "settings.export"
  | "settings.language"
  | "settings.autosave"
  | "settings.autosaveDesc"
  | "settings.showAxes"
  | "settings.showOrigin"
  | "settings.infiniteCanvas"
  | "settings.coordinateDisplay"
  | "settings.measurementPreview"
  | "settings.background"
  | "settings.rendering"
  | "settings.showGrid"
  | "settings.majorGrid"
  | "settings.minorGrid"
  | "settings.adaptiveGrid"
  | "settings.gridSize"
  | "settings.gridColor"
  | "settings.snapToggle"
  | "settings.snapRadius"
  | "settings.tikzMode"
  | "settings.includeMetadata"
  | "settings.preserveStyles"
  | "settings.autosaveProjects"
  | "theme.neoBrutalism"
  | "theme.tacticalDark"
  | "theme.darkArctic"
  | "theme.dark"
  | "theme.light"
  | "theme.system"
  | "lang.english"
  | "lang.vietnamese"
  // Panels
  | "panel.properties"
  | "panel.geometry"
  | "panel.style"
  | "panel.objects"
  // Properties
  | "prop.visible"
  | "prop.locked"
  | "prop.name"
  | "prop.labelVisible"
  | "prop.labelPosition"
  | "prop.labelSize"
  | "prop.stroke"
  | "prop.strokeWidth"
  | "prop.strokeOpacity"
  | "prop.fill"
  | "prop.fillOpacity"
  | "prop.dash"
  | "prop.pointSize"
  | "prop.showEqualityTicks"
  // Workspace
  | "workspace.create"
  | "workspace.load"
  | "workspace.empty"
  | "workspace.loadExample"
  // Buttons
  | "btn.close"
  | "btn.save"
  | "btn.cancel"
  | "btn.delete"
  | "btn.copy"
  | "btn.paste"
  | "btn.undo"
  | "btn.redo";

type Translations = Record<TranslationKey, string>;

const en: Translations = {
  // Toolbar tools
  "tool.select": "Select",
  "tool.point": "Point",
  "tool.line": "Line",
  "tool.segment": "Segment",
  "tool.ray": "Ray",
  "tool.circle": "Circle",
  "tool.arc": "Arc",
  "tool.perpendicular": "Perpendicular",
  "tool.parallel": "Parallel",
  "tool.perpendicularBisector": "Perp. Bisector",
  "tool.angleBisector": "Angle Bisector",
  "tool.midpoint": "Midpoint",
  "tool.intersect": "Intersect",
  "tool.distance": "Distance",
  "tool.angle": "Angle",
  "tool.area": "Area",
  "tool.polygon": "Polygon",
  "tool.slider": "Slider",
  "tool.text": "Text",
  "tool.delete": "Delete",
  // Settings
  "settings.title": "Settings",
  "settings.workspace": "Workspace",
  "settings.appearance": "Appearance",
  "settings.theme": "Color Mode",
  "settings.appTheme": "Visual Style",
  "settings.canvas": "Canvas",
  "settings.grid": "Grid",
  "settings.snap": "Snap",
  "settings.tikz": "TikZ",
  "settings.export": "Export",
  "settings.language": "Language",
  "settings.autosave": "Autosave",
  "settings.autosaveDesc": "Autosave is active while the workspace is open.",
  "settings.showAxes": "Show Axes",
  "settings.showOrigin": "Show Origin",
  "settings.infiniteCanvas": "Infinite Canvas",
  "settings.coordinateDisplay": "Coordinate Display",
  "settings.measurementPreview": "Measurement Preview",
  "settings.background": "Background",
  "settings.rendering": "Rendering",
  "settings.showGrid": "Show Grid",
  "settings.majorGrid": "Major Grid",
  "settings.minorGrid": "Minor Grid",
  "settings.adaptiveGrid": "Adaptive Grid",
  "settings.gridSize": "Grid Size",
  "settings.gridColor": "Grid Color",
  "settings.snapToggle": "Snap Toggle",
  "settings.snapRadius": "Snap Radius",
  "settings.tikzMode": "Mode",
  "settings.includeMetadata": "Include project metadata",
  "settings.preserveStyles": "Preserve object styles",
  "settings.autosaveProjects": "Autosave Projects",
  "theme.neoBrutalism": "Neo-Brutalism",
  "theme.tacticalDark": "Tactical Dark",
  "theme.darkArctic": "Dark Arctic",
  "theme.dark": "Dark",
  "theme.light": "Light",
  "theme.system": "System",
  "lang.english": "English",
  "lang.vietnamese": "Vietnamese",
  // Panels
  "panel.properties": "Properties",
  "panel.geometry": "Geometry",
  "panel.style": "Style",
  "panel.objects": "Objects",
  // Properties
  "prop.visible": "Visible",
  "prop.locked": "Locked",
  "prop.name": "Name",
  "prop.labelVisible": "Show Label",
  "prop.labelPosition": "Label Position",
  "prop.labelSize": "Label Size",
  "prop.stroke": "Stroke",
  "prop.strokeWidth": "Width",
  "prop.strokeOpacity": "Opacity",
  "prop.fill": "Fill",
  "prop.fillOpacity": "Fill Opacity",
  "prop.dash": "Dash",
  "prop.pointSize": "Point Size",
  "prop.showEqualityTicks": "Show Equality Ticks",
  // Workspace
  "workspace.create": "Create",
  "workspace.load": "Load",
  "workspace.empty": "Empty workspace",
  "workspace.loadExample": "Load Example",
  // Buttons
  "btn.close": "Close",
  "btn.save": "Save",
  "btn.cancel": "Cancel",
  "btn.delete": "Delete",
  "btn.copy": "Copy",
  "btn.paste": "Paste",
  "btn.undo": "Undo",
  "btn.redo": "Redo",
};

const vi: Translations = {
  // Toolbar tools
  "tool.select": "Chọn",
  "tool.point": "Điểm",
  "tool.line": "Đường thẳng",
  "tool.segment": "Đoạn thẳng",
  "tool.ray": "Tia",
  "tool.circle": "Đường tròn",
  "tool.arc": "Cung tròn",
  "tool.perpendicular": "Đường vuông góc",
  "tool.parallel": "Đường song song",
  "tool.perpendicularBisector": "Đường trung trực",
  "tool.angleBisector": "Tia phân giác",
  "tool.midpoint": "Trung điểm",
  "tool.intersect": "Giao điểm",
  "tool.distance": "Khoảng cách",
  "tool.angle": "Góc",
  "tool.area": "Diện tích",
  "tool.polygon": "Đa giác",
  "tool.slider": "Thanh trượt",
  "tool.text": "Văn bản",
  "tool.delete": "Xóa",
  // Settings
  "settings.title": "Cài đặt",
  "settings.workspace": "Không gian làm việc",
  "settings.appearance": "Giao diện",
  "settings.theme": "Chế độ màu",
  "settings.appTheme": "Phong cách hiển thị",
  "settings.canvas": "Canvas",
  "settings.grid": "Lưới",
  "settings.snap": "Hút từ",
  "settings.tikz": "TikZ",
  "settings.export": "Xuất file",
  "settings.language": "Ngôn ngữ",
  "settings.autosave": "Tự động lưu",
  "settings.autosaveDesc": "Tự động lưu khi không gian làm việc đang mở.",
  "settings.showAxes": "Hiện trục tọa độ",
  "settings.showOrigin": "Hiện gốc tọa độ",
  "settings.infiniteCanvas": "Canvas vô hạn",
  "settings.coordinateDisplay": "Hiện tọa độ",
  "settings.measurementPreview": "Xem trước đo lường",
  "settings.background": "Nền",
  "settings.rendering": "Chất lượng",
  "settings.showGrid": "Hiện lưới",
  "settings.majorGrid": "Lưới chính",
  "settings.minorGrid": "Lưới phụ",
  "settings.adaptiveGrid": "Lưới thích ứng",
  "settings.gridSize": "Kích thước ô lưới",
  "settings.gridColor": "Màu lưới",
  "settings.snapToggle": "Bật/tắt hút từ",
  "settings.snapRadius": "Bán kính hút từ",
  "settings.tikzMode": "Chế độ",
  "settings.includeMetadata": "Bao gồm thông tin dự án",
  "settings.preserveStyles": "Giữ nguyên kiểu đối tượng",
  "settings.autosaveProjects": "Tự động lưu dự án",
  "theme.neoBrutalism": "Neo-Brutalism",
  "theme.tacticalDark": "Tactical Dark",
  "theme.darkArctic": "Dark Arctic",
  "theme.dark": "Tối",
  "theme.light": "Sáng",
  "theme.system": "Theo hệ thống",
  "lang.english": "Tiếng Anh",
  "lang.vietnamese": "Tiếng Việt",
  // Panels
  "panel.properties": "Thuộc tính",
  "panel.geometry": "Hình học",
  "panel.style": "Kiểu dáng",
  "panel.objects": "Đối tượng",
  // Properties
  "prop.visible": "Hiển thị",
  "prop.locked": "Khóa",
  "prop.name": "Tên",
  "prop.labelVisible": "Hiện nhãn",
  "prop.labelPosition": "Vị trí nhãn",
  "prop.labelSize": "Cỡ nhãn",
  "prop.stroke": "Nét",
  "prop.strokeWidth": "Độ dày",
  "prop.strokeOpacity": "Độ trong suốt",
  "prop.fill": "Tô màu",
  "prop.fillOpacity": "Độ trong suốt tô",
  "prop.dash": "Nét đứt",
  "prop.pointSize": "Cỡ điểm",
  "prop.showEqualityTicks": "Hiện ký hiệu bằng nhau",
  // Workspace
  "workspace.create": "Tạo mới",
  "workspace.load": "Tải lên",
  "workspace.empty": "Không gian trống",
  "workspace.loadExample": "Tải ví dụ",
  // Buttons
  "btn.close": "Đóng",
  "btn.save": "Lưu",
  "btn.cancel": "Hủy",
  "btn.delete": "Xóa",
  "btn.copy": "Sao chép",
  "btn.paste": "Dán",
  "btn.undo": "Hoàn tác",
  "btn.redo": "Làm lại",
};

const translations: Record<Language, Translations> = { en, vi };

export function t(key: TranslationKey, language: Language): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}

export type { TranslationKey };
