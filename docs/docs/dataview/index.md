---
title: Dataview
sidebar_position: 10000
---

Datacore is a direct successor to the dataview plugin, which serves the same core function - saving useful information about
your vault an index and allowing it to be searched and compiled into views. Datacore comes with a few important changes
over it's predecessor:

- **Datacore is substantially faster** - up to 100 times faster than dataview thanks to an index design which can optimize
    many query types and avoids many internal inefficiencies.
- **Datacore provides section and block-level data**: You can query for individual sections, blocks, lines, and canvas items
    using datacore.
- **Datacore has a much more powerful javascript API**: Datacore allows for creating very complex and live-updating views thanks
to the addition of the React API and a more expansive plugin and view API.
    - Datacore also adds support for importing code files to allow code reuse.
    - Datacore also adds support for directly using JSX as well as Typescript to fully make use of React.
- **Datacore views have more features by default**: All datacore views support paging, embedding complex components in other components,
    special columns like rating.