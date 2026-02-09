# AnyBlock CHANGELOG

Display in reverse chronological order

## 3.4.3 (2026-02-09)

(Does not include beta version changelogs between the previous official release and this version. For more update details, please check independently.)

- feat
  - Support custom `[]` header regex
  - Added script subproject, including some new commands:
    - Quickly generate temporary files to facilitate exporting PDFs with AnyBlock rendering
    - Refresh view
    - Remove AnyBlock header identifiers
  - Toolbar added: wider button
- enhance
  - Some code optimizations
  - Avoid global style pollution of mermaid
- fix
  - Default avoidance of conflicts with dataview inline attributes `[::]`
  - Alias settings save failure
  - Fold processor failure in non-Obsidian environments
- pro
  - Settings panel related configurations
- refactor / chore
  - Refactored the use of jsdom in environments such as markdown-it vuepress plugin, allowing virtual browser environment injection only when needed to avoid environmental pollution
  - Refactored the structure of CodeMirror program files, added CodeMirror2 subproject
  - Renamed ABReg file (please note if you have forked and modified), and added centralized management of multi-platform differentiated APIs in ABCSetting
  - Added remark plugin version, improved universality. Created demos for using AnyBlock in Quartz4 and Docusaurus

## 3.4.1-beta3 (2025-12-24)

- feat
  - The new expandable toolbar and the toolbar now have a "copy function"
  - The *Vuepress* version supports client-side rendering (default is server-side rendering)
  - A new version of *remark* has been added (currently only tested for application in the Quartz framework)
- fix
  - Optimization of the position where the text prompt appears when the refresh button in the status bar is clicked. @Moy

## 3.4.1-beta2 (~~2025-11-27~~ 2025-12-01)

- Features
  - Add context menu (this feature has been transferred to the [AnyMenu](https://github.com/any-menu/any-menu/) plugin by the same author)
  - Status bar additions: Force refresh button
  - `listdata2task` handler, `task2` alias system
  - Multiple handlers for the echarts category, require use with the [Charts](https://github.com/any-block/obsidian-charts) plugin by the same author
    - echarts tree diagram `list2echarts_tree` and its multiple branches (direction, radial, broken line)
    - echarts sunburst diagram `list2echarts_sunburst`
    - echarts Gantt chart `list2echarts_gantt`
  - Add more buttons and a copy button to the AnyBlock block tooltip
- Enhancements
  - Abnormal min version size; further compressed the volume of the min and pro versions
  - Use tabs to beautify the settings panel
  - Pro version: Display validity period, adopt a dual-license strategy
  - Better support for markdown-it selector in reading mode
  - Improved the timing of the re-rendering mode for the reading mode
- Fixes
  - Issue with folding in the dir handler: Ancestor folding should affect direct children rather than all descendants
  - Abnormal behavior in the latest version of vuepress with the markdown-it version of anyblock
  - Linkage: Improved experience when using in thino
- Documentation
  - New additions: Table width, timeline, style explanation 2, AnyMenu linkage explanation, sequence diagrams, echarts, echarts plugin linkage explanation, etc. (Not fully completed)

## 3.4.0-beta (2025-09-05)

- Features
  - App version with CodeMirror edition completed!
  - Allows experiencing Pro features in the app version of the CodeMirror edition!
  - Visual Editing Related (ProVersion) #80
    - Partial effect demo: https://github.com/any-block/any-block/discussions/189
    - Refactoring: Provided processors with optional additional context required for visual editing
    - Phase 1 of the visual editing plan：Callout, exTable (semi-finished), col, tabs
    - (Doing) context menu
- Enhancements
  - Generalized syntax for the FAQ processor
  - Display block IDs in debug mode for easier debugging and update frequency inspection
  - Documentation
    - Corrections to potentially misleading sections in some documentation
    - Refactored demo construction logic in the online demo, added more demos, and made future demos easier to extend
    - Updated all images on the homepage documentation to include both effects and source code
- Fixes
  - Fixed abnormal indentation in `data2list`, thereby resolving abnormal indentation in `title2list`
  - Some resources (scheduled tasks) not unloading when the plugin is closed
  - Missing indentation in `list2listdata` #191
  - Reading mode not forcing rendering after modifying AnyBlock-related content (a bug introduced in a previous version fix)
- Refactoring
  - Rewrote and refactored the processor context to prepare interfaces for the Pro edition (details in the Visual Editing section)
  - Rewrote the new selector module, suitable for general CodeMirror environments
  - Improved display logic for multiple windows (e.g., left live mode, right reading mode)
  - Dependencies
    - Updated all dependencies comprehensively
    - Completed the "Editable Block" module project
    - Completed the "Cm" module project：To rewrite and extend selectors, supporting callout selectors (in non-Obsidian)
    - Completed the "Pro" module project：Rewrote some processors for the visual editing edition

> [!warning]
> The Pro version uses different dependencies, resulting in a slightly larger size. Currently, it is in the beta stage and its stability requires a certain amount of testing over time.
> Like the [min version](https://github.com/any-block/obsidian-any-block-min), it is also an independent version.
> The Pro version only adds things related to visual editing. The remaining functions and grammar will remain consistent with the non-Pro version to achieve maximum universality.

## 3.3.2 patch4 (2025-08-02)

- Feat
  - Added `strictTable` handler for use with table transposition
  - Added Codemirror online demo page (semi-complete, full implementation in next version)
- Enhance
  - Refactored code patterns and migrated to Obsidian API (passed secondary code review from Obsidian)
  - Refactored table-related handlers, encapsulated reusable code into `TableMap`
- Fix
  - Minimum auto-refresh interval `1000ms → 500ms`
  - Markmap rendering issues when formulas are present #177
  - Potential infinite refresh when notes self-reference specific blocks #171
  - `activityDiagram` handler fails when using `match` keyword instead of `switch` #168
  - Code block selectors with nested indentation not handling space prefixes correctly
  - Mobile edit button optimization #183 (The display size seems to have been restricted by the mobile device, but the clickable area has been restored to its normal state.)
- Docs
  - Improved multi-language support
  - Merged tables, fixed broken links, beautified documentation homepage

## 3.3.1 (2025-07-05)

- BREAKCAHNGE
  - The processor list command `info` conflicts with `callout info`, and is renamed to `info_converter`.
  - Horizontal scrolling regular expression optimization: `/^scroll(\((\d+)\))?(T)?$/` -> `/^scroll(X)?(\((\d+)\))?$/`
- Features
  - Case study using the new processor `mdit2code` to resolve markdown-it-container nesting issues
- Enhancements
  - `mdit2code` will process `@` symbol as h1
  - Stop using markdown rendering for filenames in dir/dt processors (because filenames like `01. filename` would become block elements: lists)
- Fixes
  - Fixed malfunction of special `listtable|fold` combination (caused by previous version changes)
  - Fixed unrecognized trailing `/` when folder names in dir/dt processors contain trailing spaces
  - Fixed `2table|width` combination where the latter fails (unable to recognize tables converted from ab) #161
  - Fixed symbol recognition issue with `+-` in `callout __` processor
  - fix activityDiagram @J0HN50N133 
  - The refresh enhancement feature added in the previous version has failed.
- Styles
  - Hover cursor for tabs processor
- Refactors
  - Refactored CodeMirror decoration set code, **improved performance by reducing re-rendered sections when cursor enters/exits anyblock**
  - Optimized mermaid dependencies, reduced plugin size by using non-minified versions
  - New processor category: code-text class
  - Refactored markdown-it-container selector in app/markdown-it
    - Implemented allowlist/denylist mechanism
    - Allowed nesting

## More

For more detailed update logs, please refer to: https://github.com/any-block/any-block/releases
