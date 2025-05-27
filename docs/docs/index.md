---
title: Datacore
sidebar_position: 0
---
import {ImageFigure} from "@site/src/figure";

Datacore is a power tool for [Obsidian.md](https://obsidian.md), allowing you to create dynamic views that gather and edit data from the files in your vault.

### Getting Started

*If you just want to see something on your screen as fast as possible, follow the [quickstart](quickstart.md)! Otherwise, read on.*

All you need to get started is to download the Datacore plugin from the Obsidian Community plugins page. You may need to enable
Community Plugins before you are able to add Datacore, and then enable the plugin in the Plugins tab of Obsidian. Once installed, Datacore
will start indexing your vault, which may take several minutes - your text editor will have a section in the
gutter showing the current status of the index. Datacore is usable as soon as you install it, but results will not be complete
until indexing finishes. Future starts of your vault will use saved data and index will be much faster.

Once Datacore is installed, it's immediately ready to use!

- To learn more about what metadata is available in Datacore and what you can add, check out [Metadata](data/index.md).
- For learning how to make datacore queries, check out [Datacore Queries](data/query.md).
- To learn about how to create dynamic views, check out [Javascript Views](code-views/index.md).

Datacore is currently in a power-user stage focused on javascript/typescript savvy users - non-javscript views similar to DataviewQL
will be coming in the future!

### Datacore as an API

The datacore API typings are available via the npm package `@blacksmithgu/datacore`. If you are developing an Obsidian
plugin that you want to interop with Datacore on, you can simply:

```bash
yarn install @blacksmithgu/datacore
```

### Screenshots

<ImageFigure
    src="img/screenshots/game-list-example-blacksmithgu.png"
    caption="@blacksmithgu's view for sorting games he has played - these all come with his recommendation."/>