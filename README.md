# Datacore

Datacore is a work-in-progress re-imagining of [Dataview](https://github.com/blacksmithgu/obsidian-dataview.git) with a
focus on 2-10x better query and rendering performance, as well as fully interactible views. First working builds are
expected to be published by the end of January 2023.

### Differences from Dataview

Datacore is fundamentally the same thing as dataview - an index over Markdown files that supports live-updating views
and metadata. However, Datacore focuses on substantial index changes for performance, as well as a new sleek UI which
completely replaces traditional Dataview queries. Datacore supports all query operations that Dataview does, with some
extra functionality.

- **New Javascript API**: Javascript-based views are now React-based and support internal state, flickerless updates on
  index changes, and a new query API which is much more performant than `dv.pages().where(...)`.
- **WYSIWYG Views**: Datacore queries now use a responsive table view and can be manipulated with a table editor much more akin to
  what you would see in places like Notion and Airtable.
- **Functioning Embeds**: Markdown page, image, and video embeds now work in all views, and a new special view type
  which is just a list of embeds has been added.
- **Live Editing**: Values inside of table views can now be edited; task views include more nuanced rendering of
  metadata like due date and more operations for manipulating tasks directly.
- **Section / Block Queries**: Datacore indexes all files (including attachments, PDFs, and images), and supports queries
  at section and block level granularity.

### Current Progress

The repo has just been created and some initial framework setup; expect to see early releases available in Obsidian in
late January 2023!
