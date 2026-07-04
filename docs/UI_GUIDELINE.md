# UI_GUIDELINE.md

# NoadDVo Design System

Version: 1.0

Author: NoadDVo

Status: Draft

---

# 1. Design Philosophy

The design language of NoadDVo Geometry Studio is inspired by:

- Arctic landscapes
- Modern architecture
- Luxury editorial magazines
- Apple Human Interface
- Linear
- Framer
- Figma
- High-end CAD software

The interface should feel:

- Cold
- Premium
- Precise
- Minimal
- Spacious
- Technical
- Calm

Never childish.

Never colorful by default.

Never skeuomorphic.

Never cluttered.

The geometry itself should always remain the visual focus.

---

# 2. Brand Identity

Brand

NoadDVo

Application

NoadDVo Geometry Studio

Logo

Simple wordmark.

Uppercase N.

No unnecessary icon.

Possible icon:

Compass

Triangle

Hexagon

Snowflake-inspired geometry

---

# 3. Design Principles

Everything follows these principles.

## Principle 1

Content First

Geometry is always more important than the interface.

Panels should disappear visually.

---

## Principle 2

One Action

One click.

One obvious result.

Avoid modal complexity.

---

## Principle 3

Consistency

Every button behaves similarly.

Every panel follows same spacing.

Every interaction has same animation speed.

---

## Principle 4

Visual Calm

Avoid aggressive colors.

Use neutral tones.

Only highlight active content.

---

## Principle 5

Professional Feeling

Every detail should look intentional.

Nothing should resemble school software.

---

# 4. Color System

## Background

Primary

#111A22

Secondary

#172530

Canvas

#0F1820

---

## Surface

Surface 1

#1B2A36

Surface 2

#223544

Surface 3

#2B4254

---

## Glass Layer

rgba(255,255,255,0.05)

Blur

18px

Border

rgba(255,255,255,0.08)

---

## Primary Accent

Ice Blue

#A8D8FF

Hover

#BFE6FF

Pressed

#7FBEEB

---

## Success

#59D6B3

---

## Warning

#F8C96A

---

## Danger

#F36B7F

---

## Text

Primary

#F5FAFF

Secondary

#C9D9E7

Muted

#8FA3B6

Disabled

#607080

---

## Geometry Colors

Point

White

Segment

#E8F4FF

Circle

#D7F0FF

Construction

rgba(180,220,255,.45)

Polygon Fill

rgba(168,216,255,.16)

Selection

#79C7FF

---

# 5. Typography

Primary Font

Inter

Fallback

system-ui

---

Headings

700

Uppercase

Letter spacing

2%

---

Panel Titles

14px

Bold

Uppercase

---

Body

15px

Regular

---

Labels

13px

Medium

---

Code

JetBrains Mono

Fallback

monospace

---

TikZ Editor

14px

Monospace

Line Height

1.6

---

# 6. Spacing System

Base Unit

8px

Spacing Scale

4

8

12

16

24

32

40

48

64

96

Use only these values.

---

# 7. Border Radius

Tiny

6px

Small

10px

Medium

16px

Large

24px

Huge

32px

---

Panels

24px

Buttons

12px

Dialog

28px

---

# 8. Shadows

Small

0 2 10 rgba(0,0,0,.15)

Medium

0 10 30 rgba(0,0,0,.22)

Large

0 20 60 rgba(0,0,0,.28)

Glass Glow

0 0 30 rgba(169,216,255,.12)

Selection

0 0 12 rgba(120,200,255,.5)

---

# 9. Borders

Default

1px

rgba(255,255,255,.08)

Active

#A8D8FF

Danger

#F36B7F

---

# 10. Blur

Panel

18px

Modal

28px

Tooltip

12px

---

# 11. Grid System

Desktop

12 Columns

Max Width

1600px

Margins

32px

Gap

24px

---

Canvas always occupies remaining space.

---

# 12. Layout

---------------------------------------

Top Bar

---------------------------------------

Toolbar

Canvas

Properties

Toolbar

Canvas

Properties

Toolbar

Canvas

Properties

---------------------------------------

TikZ Panel

---------------------------------------

The canvas must always dominate visual space.
# 13. Component Library

Every UI element must belong to the Design System.

No custom one-off components unless absolutely necessary.

---

# 13.1 Button

Purpose

Primary interaction.

Variants

• Primary

• Secondary

• Ghost

• Outline

• Danger

• Success

Sizes

Small

32px

Medium

40px

Large

48px

Properties

icon

label

disabled

loading

active

tooltip

Behavior

Hover

↓

Surface becomes brighter

↓

Shadow increases

↓

Cursor pointer

Pressed

↓

Scale 0.98

↓

Transition 120ms

Disabled

↓

40% opacity

↓

No hover

---

# 13.2 Icon Button

Square button.

Sizes

36px

40px

44px

48px

Contains

Only icon.

Used for

Toolbar

Panel actions

Window actions

Context menus

Hover

Soft icy glow.

Active

Blue background.

---

# 13.3 Toolbar Button

Toolbar buttons follow same design.

Size

48 × 48

Rounded

14px

Contains

SVG icon

Tooltip

Shortcut

Example

Point

Segment

Circle

Polygon

Angle

Behavior

Click

↓

Become active

↓

Highlight

↓

Tool cursor changes

Only one active tool.

---

# 13.4 Panel

Used for

Properties

TikZ

Settings

Layers

History

Appearance

Glassmorphism.

Structure

Header

↓

Content

↓

Footer (optional)

Padding

20px

Radius

24px

Border

1px rgba(...)

---

# 13.5 Sidebar

Left side.

Contains

Toolbar.

Width

72px

Resizable later.

Background

Transparent.

Hover

Icons illuminate.

---

# 13.6 Top Navigation

Height

60px

Contains

Logo

↓

Project Name

↓

Undo

Redo

↓

Save

↓

Export

↓

Settings

↓

Profile (future)

Spacing

24px

Sticky.

---

# 13.7 Status Bar

Bottom.

Height

28px

Displays

Zoom

Coordinates

Selection count

Snap mode

TikZ status

---

# 13.8 Tabs

Used in

Properties

Settings

History

Animation

Underline style.

No boxed tabs.

---

# 13.9 Tooltip

Delay

250ms

Animation

Fade

Position

Automatic.

Dark glass.

Small shadow.

---

# 13.10 Context Menu

Right click.

Rounded

18px

Blur

18px

Contains

Icon

↓

Label

↓

Shortcut

↓

Arrow (submenu)

---

# 13.11 Modal

Centered.

Maximum width

720px

Blur background.

Animation

Scale

Fade

No bounce.

---

# 13.12 Drawer

Slides from

Right

or

Bottom

Duration

240ms

Used for

Large settings

Help

Templates

---

# 13.13 Notification

Top right.

Duration

3 seconds.

Types

Success

Warning

Error

Info

Slide in.

Fade out.

---

# 13.14 Command Palette

Shortcut

Ctrl + K

Similar to

VS Code

Linear

Raycast

Searches

Commands

Tools

Projects

Settings

Geometry actions

---

# 13.15 Search Box

Rounded

12px

Placeholder

Search...

Leading icon

Search

Trailing icon

Clear

---

# 13.16 Text Input

Height

40px

Padding

12px

Radius

12px

Focus

Blue outline.

Supports

Validation.

---

# 13.17 Number Input

Used for

Radius

Stroke width

Opacity

Angle

Coordinate

Supports

Arrow keys.

Mouse wheel.

---

# 13.18 Dropdown

Rounded.

Floating.

Searchable.

Keyboard support.

---

# 13.19 Color Picker

Must support

Solid colors

Opacity

HEX

RGB

Recent colors

Palette

Eyedropper (future)

---

# 13.20 Slider

Used for

Opacity

Stroke width

Zoom

Radius

Thickness

Smooth dragging.

---

# 13.21 Checkbox

Rounded.

Blue checkmark.

Animation

150ms.

---

# 13.22 Switch

Animated.

Blue active.

Gray inactive.

---

# 13.23 Divider

Very subtle.

Opacity

8%.

Never dark black.

---

# 13.24 Scrollbar

Thin.

Rounded.

Auto-hide.

---

# 13.25 Empty State

Illustration.

Title.

Description.

Primary Action.

Secondary Action.

Example

"No project yet."

↓

Create Project

---

# 13.26 Loading Indicator

Circular.

Thin.

Blue.

No flashy animation.

---

# 13.27 Skeleton Loader

Used before content loads.

Gray shimmer.

Rounded.

---

# 13.28 Property Row

Structure

Label

↓

Input

↓

Optional reset button

Spacing

12px

---

# 13.29 Color Chip

Circle

18px

Shows selected color.

Clickable.

---

# 13.30 Shortcut Badge

Rounded rectangle.

Background

Surface 2

Text

Monospace.
The canvas is the most important visual element.

Everything else exists to support the canvas.

---

Canvas Background

Dark Arctic.

---

Grid

Infinite.

Smooth.

Adaptive.

---

Major Grid

Every 5 cells.

Slightly brighter.

---

Axes

Soft blue.

Not dominant.

---

Origin

Visible.

Small cross.

---

Selected Object

Glow.

Outline.

Handles.

---

Preview Object

Semi-transparent.

Dashed.

---

Hover Object

Soft highlight.

---

Snap Indicator

Blue ring.

---

Selection Rectangle

Blue outline.

Low opacity fill.

---

Viewport Transition

No animation.

Always immediate.

---

Zoom

Centered around cursor.

---

Pan

Smooth.

No inertia.
TikZ is a first-class workspace.

Not just a textarea.

---

Contains

Toolbar

↓

Editor

↓

Status

---

Toolbar

Copy

Export

Wrap Document

Formatting

TikZ Mode

---

Editor

Monospace.

Dark theme.

Syntax highlight.

Readonly by default.

Editable mode later.

---

Status

Lines

Characters

Generated

Last Updated

---

Copy Animation

Button changes

↓

Copied

↓

Check icon

↓

Returns after 2 seconds.
Selecting an object opens the inspector.

Groups

General

Appearance

Geometry

Label

Advanced

---

Example

Point

General

Name

Coordinates

Visible

Locked

Appearance

Color

Size

Opacity

Label

Show Label

Position

Font

---

Circle

Radius

Center

Stroke

Fill

Dash

Opacity

---

Polygon

Vertices

Fill

Stroke

Area

Perimeter
# 17. Motion Design

Animations should communicate state changes, not distract users.

The interface must feel smooth, lightweight and precise.

Never use exaggerated animations.

Inspired by:

- Apple macOS
- Linear
- Arc Browser
- Figma

---

## Motion Principles

Every animation should answer one question:

"What changed?"

Never animate without purpose.

---

## Animation Timing

Instant

50 ms

Hover

120 ms

Button Press

90 ms

Panel Slide

220 ms

Drawer

260 ms

Modal

280 ms

Tooltip

140 ms

Toast

220 ms

Context Menu

160 ms

Command Palette

180 ms

Theme Switch

300 ms

---

## Easing

Primary

ease-out

Secondary

ease-in-out

Avoid

Bounce

Elastic

Overshoot

---

## Hover State

Hover should never dramatically change size.

Allowed:

Brightness

Glow

Border

Shadow

Opacity

Forbidden:

Rotation

Jumping

Large scaling

---

## Button Animation

Hover

↓

Background brightens

↓

Shadow increases

↓

Cursor pointer

Click

↓

Scale 0.98

↓

Return

Duration

100 ms

---

## Panel Animation

Panels fade and slide.

Distance

12 px

Duration

220 ms

Opacity

0 → 1

---

## Dialog Animation

Scale

0.96

↓

1

Opacity

0

↓

1

---

## Notification Animation

Slide

Top Right

↓

Fade

↓

Disappear

---

## Tooltip Animation

Fade

80%

↓

100%

Duration

140 ms

---

# 18. Interaction Design

Everything should feel predictable.

---

## Selection

Click

↓

Select

↓

Glow

↓

Properties update

---

## Dragging

Dragging begins immediately.

No delay.

Objects follow cursor.

---

## Multi-selection

Ctrl + Click

↓

Toggle selection

Shift + Drag

↓

Selection rectangle

---

## Preview

Every creation tool shows preview.

Preview color

Semi-transparent blue.

---

## Cancellation

ESC

Immediately cancels.

Preview disappears.

No side effects.

---

# 19. UX Flow

New User

↓

Landing Page

↓

New Project

↓

Workspace

↓

Draw Geometry

↓

TikZ Appears

↓

Copy

↓

Export

↓

Done

This workflow should require no tutorial.

---

## Editing Flow

Select Object

↓

Properties

↓

Modify

↓

Canvas updates

↓

TikZ updates

All changes should be realtime.

---

## Export Flow

Export

↓

Choose Format

↓

Preview

↓

Download

No complicated dialogs.

---

# 20. Responsive Design

Desktop First.

---

## Large Desktop

>= 1600 px

Canvas maximum size.

Panels visible.

---

## Desktop

>= 1200 px

Default layout.

---

## Laptop

>= 1024 px

Right panel collapsible.

---

## Tablet

>= 768 px

Toolbar icons larger.

Panels become drawers.

---

## Mobile

Read-only first version.

Editing later.

---

# 21. Icon System

Use only one icon family.

Recommended

Lucide

or

Tabler Icons

Do not mix icon packs.

---

## Icon Size

Toolbar

22 px

Buttons

18 px

Menu

18 px

Panel

16 px

---

## Icon Stroke

2 px

Rounded ends.

---

# 22. Design Tokens

All values should come from CSS variables.

Example

:root {

--color-bg

--color-surface

--color-border

--color-text

--color-primary

--radius-md

--radius-lg

--shadow-md

--blur-panel

--transition-fast

}

Never hardcode values inside components.

---

# 23. Accessibility

Keyboard navigation required.

Visible focus ring.

ARIA labels.

Tooltips.

High contrast support later.

Minimum touch target

44 px

Text contrast

WCAG AA

---

# 24. Empty States

Every empty screen should contain:

Illustration

↓

Title

↓

Description

↓

Primary Button

Example

"No geometry objects"

↓

Create your first point

---

"No project"

↓

New Project

---

"No search results"

↓

Try another keyword

---

# 25. Error States

Errors should never interrupt workflow.

Use:

Toast

↓

Inline message

↓

Optional dialog

Never show raw exceptions.

---

# 26. Loading States

Every async operation should show progress.

Examples

Project Loading

Skeleton

Export

Spinner

Import

Progress Bar

---

# 27. Context Menu Design

Right click anywhere.

Menu appears near cursor.

Rounded

18 px

Glass effect

Contains

Icon

↓

Label

↓

Shortcut

↓

Submenu

Actions

Delete

Duplicate

Rename

Lock

Hide

Bring Forward

Send Backward

Properties

---

# 28. Theme System

Default

Dark Arctic

Future

Light

High Contrast

Custom Theme

Theme switch should animate smoothly.

---

# 29. Layout Rules

Canvas must always occupy the largest area.

No floating windows over canvas unless necessary.

Panels may collapse.

Toolbar always visible.

---

# 30. Visual Hierarchy

Highest

Geometry

↓

Selection

↓

Properties

↓

Panels

↓

Background

The user should always focus on the drawing.

---

# 31. UX Rules

One click should do one thing.

No hidden gestures.

Undo should always work.

No destructive action without confirmation.

Settings should be remembered.

Autosave should feel invisible.

---

# 32. Brand Tone

NoadDVo is:

Professional

Elegant

Technical

Minimal

Confident

Never playful.

Never childish.

Never overloaded.

---

# 33. Inspiration Board

Reference products

Apple Final Cut

Figma

Linear

Framer

Arc Browser

Rhino 3D

Adobe Illustrator

GeoGebra (interaction only)

The visual language should be closer to Linear than to GeoGebra.

---

# 34. Definition of Done

The UI is considered complete when:

✓ Every component follows the design system.

✓ Colors use design tokens.

✓ Motion is consistent.

✓ No visual glitches.

✓ Responsive layout works.

✓ Accessibility basics are met.

✓ The application immediately feels premium.

---

# End of UI Guideline