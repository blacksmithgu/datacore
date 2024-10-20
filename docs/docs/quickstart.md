---
title: Quickstart
sidebar_position: 1
---

Want to just see something on your screen? Follow this (hopefully simple) guide to get something you can put your eyeballs on.
Note that this is using the Datacore Javascript API - the non-Javascript functionality is not available yet, so if you don't
know Javascript, the plugin may not be ready for you!

## Installation

Install Datacore from the Obsidian community plugins viewer, then enable it in your community plugins view. Datacore will then be
immediately available, though it may take some time to index your vault in the background before all results are visible.

> **Note: Beta Version**
>
> You can also install the beta version of the plugin directly from source, though we only recommend doing this if you "know what you
> are doing" and want some feature in the beta branch.
> 
> To install beta plugins, install the Obsidian BRAT plugin and add datacore to it using the plugin URL of `https://github.com/blacksmithgu/datacore`.

## The Most Trivial of Views

To immediately get something on the screen, add a datacore code block to any page of your choice. Here's a starter one which just live-updates to
show how many markdown pages you have in your vault:

~~~
```datacorejsx
// All datacore views should return a React component; in practice, this is going to be
return function View() {
    const pages = dc.useQuery("@page").length;

    return <p>You have {pages} pages in your vault!</p>;
}
```
~~~

Alternatively, if a trivial component that shows how many pages you have is too pedestrian, here is the classic table view:

~~~
```datacorejsx
// A list of columns to show in the table.
const COLUMNS = [
    { id: "Name", value: page => page.$link },
    { id: "Rating", value: page => page.value("rating") }
];

return function View() {
    // Selecting `#game` pages, for example.
    const pages = dc.useQuery("@page and #game");

    // Uses the built in 'vanilla table' component for showing objects in a table!
    return <dc.VanillaTable columns={COLUMNS} rows={pages} />;
}
```
~~~

For more of an explanation of how each of the pieces here is working, check out:

- [Queries](data/query.md) for writing queries that fetch data from your vault.
- [Views](code-views/index.md) for writing the code to actually create views over your queried data.