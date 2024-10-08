# 0.1.19 (Beta)

Adds parsing for list item symbols ($symbol), and task text ($text). In general in datacore I am trying to avoid pulling actual text contents into the index, but the task usecase is sufficiently common that
we will add it to make search much more convenient.

---

# 0.1.18 (Beta)

Use "\-" as the default null value, instead of just "-".

---

# 0.1.17 (Beta)

- Adds experimental canvas parsing / indexing / query support (thanks to @GamerGirlAndCo)!

---

# 0.1.16 (Beta)

Improves queries over $id, $revision, and $file.

---

# 0.1.15 (Beta)

Fixes field indexing, meaning you can use things like `rating >= 8` in your queries directly again (and they will also be much faster!). Thanks to @GamerGirlAndCo for the slew of fixes.

---

# 0.1.14 (Beta)

Fixes non-markdown files not showing up in the Datacore index when they are created while Obsidian is running.

---

# 0.1.13 (Beta)

Fixes parsing tags from frontmatter.

---

# 0.1.12 (Beta)

Added a (crappy looking) guard to all views which waits for Datacore to actually be initialized before proceeding.

---

# 0.1.11 (Beta)

Adds experimental support for `dc.require()`, allowing for importing other codeblocks from script files or from codeblocks in named sections.

---

# 0.1.10 (Beta)

- Fixes several annoying off-by-one errors in line span embeds and an indexing off-by-one.

---

# 0.1.9 (Beta)

- Fixes a bunch of off-by-one errors in markdown parsing, meaning block links and tags actually work now.
- Cleaned up the `dc.SpanEmbed` visual appearance to be something a bit more attractive.

---

# 0.1.8 (Beta)

- @Quorafind - Adds 'scroll to top' functionality for large tables when you change pages.
- @GamerGirlandCo - Adds a dc.Callout component that faithfully recreates the Obsidian callout.

---

# 0.1.7 (Beta)

Includes several new interactive UI elements courtesy of @Quorafind!

---

# 0.1.6 (Beta)

Group rendering in tables is now also configurable.

---

# 0.1.5 (Beta)

Improves the look of the paging UI.

---

# 0.1.4 (Beta)

Fixes several issues with link and field indexing and adds the `dc.Link` primitive for rendering obsidian links.


---

# 0.1.3 (Beta)

Beta releases containing the latest datacore incremental functionality will start now. This one includes the datacore query engine, DatacoreJS + DatacoreJSX, and the grouped table view. More will be coming in the future.

---

# 0.1.2

Still does nothing, but now has a snappy and simple query planner, as well as support for querying by type.
Next up is adding other old dataview filters, primarily tags+etags, inlinks+outlinks, and folder paths. DatacoreJS soon
to follow.

---

# 0.1.1

This code still essentially does nothing but may as well get into the habbit of releases. Datacore is capable of
indexing markdown files and sections and then storing them in a simple heirarchical database.

Datastore queries are next.

---

# 0.1.0

Initial pre-release. No functionality in the plugin aside from showing a nice and useless settings tab.