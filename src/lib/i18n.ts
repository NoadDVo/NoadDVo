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
  // Toolbar groups
  | "toolgroup.action"
  | "toolgroup.point"
  | "toolgroup.line"
  | "toolgroup.shape"
  | "toolgroup.conic"
  | "toolgroup.transform"
  | "toolgroup.measure"
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
  | "panel.general"
  | "panel.appearance"
  | "panel.label"
  | "panel.advanced"
  // Advanced Panel
  | "adv.dependencies"
  | "adv.dependents"
  | "adv.creationTime"
  | "adv.id"
  | "adv.none"
  // Properties
  | "prop.visible"
  | "prop.locked"
  | "prop.name"
  | "prop.type"
  | "prop.id"
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
  | "prop.showLabel"
  | "prop.labelText"
  | "prop.strokeColor"
  | "prop.fillColor"
  | "prop.dashStyle"
  | "prop.patternType"
  | "prop.patternColor"
  | "prop.patternDensity"
  | "prop.patternSize"
  | "prop.angle"
  | "prop.spacing"
  | "prop.lineWidth"
  // Object Tree
  | "tree.search"
  | "tree.noObjects"
  | "tree.noObjectsDesc"
  | "tree.noHidden"
  | "tree.noHiddenDesc"
  | "tree.filterAll"
  | "tree.filterPoints"
  | "tree.filterLines"
  | "tree.filterCircles"
  | "tree.filterConstruction"
  | "tree.filterMeasurements"
  | "tree.filterHidden"
  | "tree.filterLocked"
  | "tree.sectionPoints"
  | "tree.sectionSegments"
  | "tree.sectionLines"
  | "tree.sectionRays"
  | "tree.sectionVectors"
  | "tree.sectionCircles"
  | "tree.sectionArcs"
  | "tree.sectionPolygons"
  | "tree.sectionRegions"
  | "tree.sectionAngles"
  | "tree.sectionText"
  | "tree.sectionSliders"
  | "tree.sectionConstruction"
  | "tree.emptySearch"
  | "tree.emptySearchDesc"
  | "tree.selectToInspect"
  | "tree.parents"
  | "tree.children"
  | "tree.chain"
  // Landing
  | "landing.title"
  | "landing.subtitle"
  | "landing.createPoint"
  | "landing.loadExample"
  | "landing.selectExample"
  | "landing.noExamples"
  | "landing.back"
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
  | "btn.redo"
  // TopBar
  | "topbar.objectTree"
  | "topbar.inspector"
  | "topbar.toggleObjectTree"
  | "topbar.toggleInspector"
  // Project menu
  | "project.title"
  | "project.newProject"
  | "project.openProject"
  | "project.importImage"
  | "project.recentProjects"
  | "project.noRecent"
  | "project.save"
  | "project.copySelection"
  | "project.paste"
  | "project.duplicateSelection"
  | "project.import"
  | "project.loadExample"
  | "project.pasteClipboardNote"
  | "project.noExamples"
  // Export menu
  | "export.title"
  | "export.filenameprompt"
  | "export.failed"
  // Status bar
  | "statusbar.zoom"
  | "statusbar.selection"
  | "statusbar.snap"
  | "statusbar.mode"
  | "statusbar.tikz"
  | "statusbar.snapOff"
  | "statusbar.pan"
  | "statusbar.constraint"
  | "statusbar.ready"
  // Inspector / RightPanel
  | "inspector.selection"
  | "inspector.selectPrompt"
  | "inspector.chooseToolPrompt"
  | "inspector.editingFirst"
  // AppShell panel labels
  | "appshell.collapseObjectTree"
  | "appshell.collapseInspector"
  | "appshell.collapseTikz"
  | "appshell.showTikz"
  | "appshell.generatedTikz"
  // Geometry panel
  | "geom.geometry"
  | "geom.vertices"
  | "geom.perimeter"
  | "geom.area"
  | "geom.pointA"
  | "geom.pointB"
  | "geom.pointC"
  | "geom.start"
  | "geom.end"
  | "geom.through"
  | "geom.center"
  | "geom.direction"
  | "geom.radius"
  | "geom.vertex"
  | "geom.rightAngle"
  | "geom.currentAngle"
  | "geom.showAngleMeasure"
  | "geom.label"
  | "geom.xRadius"
  | "geom.yRadius"
  | "geom.boundaryPoints"
  | "geom.sourceType"
  | "geom.opacity"
  | "geom.width"
  | "geom.height"
  | "geom.details"
  | "geom.noEditable"
  | "geom.unavailable"
  | "geom.yes"
  | "geom.no"
  | "geom.sliderSettings"
  | "geom.min"
  | "geom.max"
  | "geom.step"
  | "geom.value"
  | "geom.autoPlay"
  | "geom.pause"
  | "geom.play"
  | "geom.speed"
  | "geom.variableName"
  | "geom.bindSlider"
  | "geom.noneOption"
  | "geom.showEqualityTicks"
  // Advanced panel
  | "panel.advanced"
  | "adv.dependencies"
  | "adv.dependents"
  | "adv.creationTime"
  | "adv.metadata"
  | "adv.none"
  | "adv.sessionSeed";

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
  // Toolbar groups
  "toolgroup.action": "Actions",
  "toolgroup.point": "Point",
  "toolgroup.line": "Line",
  "toolgroup.shape": "Circle & Polygon",
  "toolgroup.conic": "Conic",
  "toolgroup.transform": "Transform",
  "toolgroup.measure": "Measure & Utilities",
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
  "panel.general": "General",
  "panel.appearance": "Appearance",
  "panel.label": "Label",
  "panel.advanced": "Advanced",
  // Advanced Panel
  "adv.dependencies": "Dependencies",
  "adv.dependents": "Dependents",
  "adv.creationTime": "Creation Time",
  "adv.id": "Object ID",
  "adv.metadata": "Metadata",
  "adv.sessionSeed": "Session Seed",
  "adv.none": "None",
  // Properties
  "prop.visible": "Visible",
  "prop.locked": "Locked",
  "prop.name": "Name",
  "prop.type": "Type",
  "prop.id": "ID",
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
  "prop.showLabel": "Show Label",
  "prop.labelText": "Label Text",
  "prop.strokeColor": "Stroke",
  "prop.fillColor": "Fill",
  "prop.dashStyle": "Dash Style",
  "prop.patternType": "Pattern Type",
  "prop.patternColor": "Pattern Color",
  "prop.patternDensity": "Pattern Density",
  "prop.patternSize": "Pattern Size",
  "prop.angle": "Angle",
  "prop.spacing": "Spacing",
  "prop.lineWidth": "Line W.",
  // Object Tree
  "tree.search": "Search objects",
  "tree.noObjects": "No geometry objects",
  "tree.noObjectsDesc": "Create a point or load an example to populate the tree.",
  "tree.noHidden": "No hidden objects",
  "tree.noHiddenDesc": "All objects are currently visible. Hide objects using the eye icon in the object list.",
  "tree.filterAll": "All",
  "tree.filterPoints": "Points",
  "tree.filterLines": "Lines",
  "tree.filterCircles": "Circles",
  "tree.filterConstruction": "Construction",
  "tree.filterMeasurements": "Measurements",
  "tree.filterHidden": "Hidden",
  "tree.filterLocked": "Locked",
  "tree.sectionPoints": "Points",
  "tree.sectionSegments": "Segments",
  "tree.sectionLines": "Lines",
  "tree.sectionRays": "Rays",
  "tree.sectionVectors": "Vectors",
  "tree.sectionCircles": "Circles",
  "tree.sectionArcs": "Arcs",
  "tree.sectionPolygons": "Polygons",
  "tree.sectionRegions": "Regions",
  "tree.sectionAngles": "Angles",
  "tree.sectionText": "Text",
  "tree.sectionSliders": "Sliders",
  "tree.sectionConstruction": "Construction",
  "tree.emptySearch": "No matches found",
  "tree.emptySearchDesc": "Try a different search term or clear the filter.",
  "tree.selectToInspect": "Select an object to inspect dependency links.",
  "tree.parents": "Parents",
  "tree.children": "Children",
  "tree.chain": "Chain",
  // Landing
  "landing.title": "EMPTY WORKSPACE",
  "landing.subtitle": "CREATE YOUR FIRST OBJECT",
  "landing.createPoint": "CREATE A POINT",
  "landing.loadExample": "LOAD EXAMPLE",
  "landing.selectExample": "SELECT EXAMPLE",
  "landing.noExamples": "No examples found in /EXAMPLE",
  "landing.back": "Back",
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
  // TopBar
  "topbar.objectTree": "Object Tree",
  "topbar.inspector": "Inspector",
  "topbar.toggleObjectTree": "Toggle Object Tree",
  "topbar.toggleInspector": "Toggle Properties",
  // Project menu
  "project.title": "Project",
  "project.newProject": "New Project",
  "project.openProject": "Open Project",
  "project.importImage": "Import Reference Image",
  "project.recentProjects": "Recent Projects",
  "project.noRecent": "No recent projects yet.",
  "project.save": "Save",
  "project.copySelection": "Copy Selection",
  "project.paste": "Paste",
  "project.duplicateSelection": "Duplicate Selection",
  "project.import": "Import",
  "project.loadExample": "Load Example",
  "project.pasteClipboardNote": "Paste uses the internal geometry clipboard.",
  "project.noExamples": "No examples found",
  // Export menu
  "export.title": "Export",
  "export.filenameprompt": "Enter file name:",
  "export.failed": "Export failed. Please try again.",
  // Status bar
  "statusbar.zoom": "Zoom",
  "statusbar.selection": "Selection",
  "statusbar.snap": "Snap",
  "statusbar.mode": "Mode",
  "statusbar.tikz": "TikZ",
  "statusbar.snapOff": "Off",
  "statusbar.pan": "Pan",
  "statusbar.constraint": "Constraint",
  "statusbar.ready": "Ready",
  // Inspector / RightPanel
  "inspector.selection": "Selection",
  "inspector.selectPrompt": "Select an object to edit its properties.",
  "inspector.chooseToolPrompt": "Or choose a drawing tool from the toolbar.",
  "inspector.editingFirst": "Editing first of {count} selected objects.",
  // AppShell panel labels
  "appshell.collapseObjectTree": "Collapse Object Tree",
  "appshell.collapseInspector": "Collapse Inspector",
  "appshell.collapseTikz": "Collapse Generated TikZ",
  "appshell.showTikz": "Show Generated TikZ",
  "appshell.generatedTikz": "Generated TikZ",
  // Geometry panel
  "geom.geometry": "Geometry",
  "geom.vertices": "Vertices",
  "geom.perimeter": "Perimeter",
  "geom.area": "Area",
  "geom.pointA": "Point A",
  "geom.pointB": "Point B",
  "geom.pointC": "Point C",
  "geom.start": "Start",
  "geom.end": "End",
  "geom.through": "Through",
  "geom.center": "Center",
  "geom.direction": "Direction",
  "geom.radius": "Radius",
  "geom.vertex": "Vertex",
  "geom.rightAngle": "Right Angle",
  "geom.currentAngle": "Current Angle",
  "geom.showAngleMeasure": "Show Angle Measure",
  "geom.label": "Label",
  "geom.xRadius": "x radius",
  "geom.yRadius": "y radius",
  "geom.boundaryPoints": "Boundary Points",
  "geom.sourceType": "Source Type",
  "geom.opacity": "Opacity",
  "geom.width": "Width",
  "geom.height": "Height",
  "geom.details": "Details",
  "geom.noEditable": "No editable geometry fields",
  "geom.unavailable": "Unavailable",
  "geom.yes": "Yes",
  "geom.no": "No",
  "geom.sliderSettings": "Slider Settings",
  "geom.min": "Min",
  "geom.max": "Max",
  "geom.step": "Step",
  "geom.value": "Value",
  "geom.autoPlay": "Auto Play",
  "geom.pause": "Pause",
  "geom.play": "Play",
  "geom.speed": "Speed (units/s)",
  "geom.variableName": "Variable Name",
  "geom.bindSlider": "Bind to Slider",
  "geom.noneOption": "-- None --",
  "geom.showEqualityTicks": "Show Equality Ticks",
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
  // Toolbar groups
  "toolgroup.action": "Thao tác",
  "toolgroup.point": "Điểm",
  "toolgroup.line": "Đường thẳng",
  "toolgroup.shape": "Hình tròn & Đa giác",
  "toolgroup.conic": "Đường conic",
  "toolgroup.transform": "Phép biến hình",
  "toolgroup.measure": "Đo lường & Tiện ích",
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
  "panel.general": "Tổng quát",
  "panel.appearance": "Giao diện",
  "panel.label": "Nhãn",
  "panel.advanced": "Nâng cao",
  // Advanced Panel
  "adv.dependencies": "Phụ thuộc",
  "adv.dependents": "Bị phụ thuộc",
  "adv.creationTime": "Thời gian tạo",
  "adv.id": "ID",
  "adv.metadata": "Siêu dữ liệu",
  "adv.sessionSeed": "Mã phiên",
  "adv.none": "Không có",
  // Properties
  "prop.visible": "Hiển thị",
  "prop.locked": "Khóa",
  "prop.name": "Tên",
  "prop.type": "Loại",
  "prop.id": "ID",
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
  "prop.showLabel": "Hiện nhãn",
  "prop.labelText": "Văn bản nhãn",
  "prop.strokeColor": "Màu nét",
  "prop.fillColor": "Màu tô",
  "prop.dashStyle": "Kiểu nét đứt",
  "prop.patternType": "Kiểu mẫu",
  "prop.patternColor": "Màu mẫu",
  "prop.patternDensity": "Mật độ mẫu",
  "prop.patternSize": "Kích thước mẫu",
  "prop.angle": "Góc",
  "prop.spacing": "Khoảng cách",
  "prop.lineWidth": "Độ dày nét",
  // Object Tree
  "tree.search": "Tìm kiếm đối tượng",
  "tree.noObjects": "Chưa có đối tượng",
  "tree.noObjectsDesc": "Tạo một điểm hoặc tải ví dụ để xem danh sách.",
  "tree.noHidden": "Không có đối tượng ẩn",
  "tree.noHiddenDesc": "Tất cả đang hiển thị. Hãy dùng biểu tượng mắt để ẩn bớt.",
  "tree.filterAll": "Tất cả",
  "tree.filterPoints": "Điểm",
  "tree.filterLines": "Đường thẳng",
  "tree.filterCircles": "Đường tròn",
  "tree.filterConstruction": "Dựng hình",
  "tree.filterMeasurements": "Đo lường",
  "tree.filterHidden": "Đã ẩn",
  "tree.filterLocked": "Đã khóa",
  "tree.sectionPoints": "Điểm",
  "tree.sectionSegments": "Đoạn thẳng",
  "tree.sectionLines": "Đường thẳng",
  "tree.sectionRays": "Tia",
  "tree.sectionVectors": "Vector",
  "tree.sectionCircles": "Đường tròn",
  "tree.sectionArcs": "Cung tròn",
  "tree.sectionPolygons": "Đa giác",
  "tree.sectionRegions": "Vùng",
  "tree.sectionAngles": "Góc",
  "tree.sectionText": "Văn bản",
  "tree.sectionSliders": "Thanh trượt",
  "tree.sectionConstruction": "Dựng hình",
  "tree.emptySearch": "Không tìm thấy",
  "tree.emptySearchDesc": "Thử tìm từ khóa khác hoặc xóa bộ lọc.",
  "tree.selectToInspect": "Chọn một đối tượng để xem các liên kết phụ thuộc.",
  "tree.parents": "Cha",
  "tree.children": "Con",
  "tree.chain": "Chuỗi",
  // Landing
  "landing.title": "KHÔNG GIAN TRỐNG",
  "landing.subtitle": "TẠO ĐỐI TƯỢNG ĐẦU TIÊN CỦA BẠN",
  "landing.createPoint": "TẠO MỘT ĐIỂM",
  "landing.loadExample": "TẢI VÍ DỤ",
  "landing.selectExample": "CHỌN VÍ DỤ",
  "landing.noExamples": "Không tìm thấy ví dụ trong thư mục /EXAMPLE",
  "landing.back": "Quay lại",
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
  // TopBar
  "topbar.objectTree": "Cây đối tượng",
  "topbar.inspector": "Trình kiểm tra",
  "topbar.toggleObjectTree": "Bật/tắt cây đối tượng",
  "topbar.toggleInspector": "Bật/tắt thuộc tính",
  // Project menu
  "project.title": "Dự án",
  "project.newProject": "Dự án mới",
  "project.openProject": "Mở dự án",
  "project.importImage": "Nhập ảnh tham chiếu",
  "project.recentProjects": "Dự án gần đây",
  "project.noRecent": "Chưa có dự án gần đây.",
  "project.save": "Lưu",
  "project.copySelection": "Sao chép vùng chọn",
  "project.paste": "Dán",
  "project.duplicateSelection": "Nhân đôi vùng chọn",
  "project.import": "Nhập",
  "project.loadExample": "Tải ví dụ",
  "project.pasteClipboardNote": "Dán dùng clipboard hình học nội bộ.",
  "project.noExamples": "Không tìm thấy ví dụ",
  // Export menu
  "export.title": "Xuất",
  "export.filenameprompt": "Nhập tên file:",
  "export.failed": "Xuất file thất bại. Vui lòng thử lại.",
  // Status bar
  "statusbar.zoom": "Zoom",
  "statusbar.selection": "Chọn",
  "statusbar.snap": "Hút",
  "statusbar.mode": "Chế độ",
  "statusbar.tikz": "TikZ",
  "statusbar.snapOff": "Tắt",
  "statusbar.pan": "Di chuyển",
  "statusbar.constraint": "Ràng buộc",
  "statusbar.ready": "Sẵn sàng",
  // Inspector / RightPanel
  "inspector.selection": "Vùng chọn",
  "inspector.selectPrompt": "Chọn một đối tượng để chỉnh sửa thuộc tính.",
  "inspector.chooseToolPrompt": "Hoặc chọn công cụ vẽ từ thanh công cụ.",
  "inspector.editingFirst": "Đang sửa phần tử đầu tiên trong {count} đối tượng đã chọn.",
  // AppShell panel labels
  "appshell.collapseObjectTree": "Thu gọn cây đối tượng",
  "appshell.collapseInspector": "Thu gọn trình kiểm tra",
  "appshell.collapseTikz": "Thu gọn TikZ đã tạo",
  "appshell.showTikz": "Hiện TikZ đã tạo",
  "appshell.generatedTikz": "TikZ đã tạo",
  // Geometry panel
  "geom.geometry": "Hình học",
  "geom.vertices": "Đỉnh",
  "geom.perimeter": "Chu vi",
  "geom.area": "Diện tích",
  "geom.pointA": "Điểm A",
  "geom.pointB": "Điểm B",
  "geom.pointC": "Điểm C",
  "geom.start": "Đầu",
  "geom.end": "Cuối",
  "geom.through": "Qua",
  "geom.center": "Tâm",
  "geom.direction": "Hướng",
  "geom.radius": "Bán kính",
  "geom.vertex": "Đỉnh",
  "geom.rightAngle": "Góc vuông",
  "geom.currentAngle": "Góc hiện tại",
  "geom.showAngleMeasure": "Hiện số đo góc",
  "geom.label": "Nhãn",
  "geom.xRadius": "Bán kính x",
  "geom.yRadius": "Bán kính y",
  "geom.boundaryPoints": "Điểm biên",
  "geom.sourceType": "Loại nguồn",
  "geom.opacity": "Độ trong suốt",
  "geom.width": "Chiều rộng",
  "geom.height": "Chiều cao",
  "geom.details": "Chi tiết",
  "geom.noEditable": "Không có trường hình học có thể chỉnh sửa",
  "geom.unavailable": "Không khả dụng",
  "geom.yes": "Có",
  "geom.no": "Không",
  "geom.sliderSettings": "Cài đặt thanh trượt",
  "geom.min": "Tối thiểu",
  "geom.max": "Tối đa",
  "geom.step": "Bước",
  "geom.value": "Giá trị",
  "geom.autoPlay": "Tự động phát",
  "geom.pause": "Dừng",
  "geom.play": "Phát",
  "geom.speed": "Tốc độ (đơn vị/s)",
  "geom.variableName": "Tên biến",
  "geom.bindSlider": "Gắn vào thanh trượt",
  "geom.noneOption": "-- Không --",
  "geom.showEqualityTicks": "Hiện ký hiệu bằng nhau",
};

const translations: Record<Language, Translations> = { en, vi };

export function t(key: TranslationKey, language: Language): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}

export type { TranslationKey };
