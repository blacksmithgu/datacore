---
title: Blocks
sidebar_position: 302
---

> Note: Documentation under construction.

Datacore tracks every markdown block in markdown files and in canvas files.

| **Field** | **Description** | **Example** |
| - | - | - |
| `$position` | The position of the block. Datacore positions are recorded as `{ start, end }` line numbers, where start is inclusive and end is exclusive. | `{ start: 0, end: 7 }` |
| `$tags` | A list of unique tags in the block. | `["#game", "#todo/revisit"]` |
| `$link` | A Link object that links to this block, if the block has a block ID that can be linked to. Otherwise, is undefined. | `[[Dark Souls#^blockId]]` |