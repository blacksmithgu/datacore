---
banner: "![[dash-banner.png]]"
banner: ""
banner_y: -1.1
banner_x: 0.97531
banner_lock: true
nested:
  other: hi
---

\[inline:: hi]

<h1 align="center" style="text-shadow: 0px 4px #ff438ba1; font-size:4em; text-align: center">🌸 welcome~ 🌸</h1>

```dataviewjs
const today = DateTime.now()
const endOfYear = {
    year: today.year,
    month: 12,
    day: 31
}
const birthday = DateTime.fromObject({
    year: today.year,
    month: 8,
    day: 11
});
const lastbirthday = birthday.minus({year: 1})
const nextbirthday = birthday.plus({year: 1})
console.log(birthday, lastbirthday)
console.log(today.diff(lastbirthday))
function progress(type) {
    let value;
    switch(type) {
        case "lifespan": 
		    let bol = (today.startOf("day") >= birthday.startOf("day"))
	        let fac = bol ? 1 : -1
	        console.log(today.diff(nextbirthday).as("days"))
	        console.log(today, birthday, nextbirthday)
            value = (
	            (
		            (
			            (today.diff(bol ? birthday : nextbirthday).as("days") * fac)
					)
		        ) 
	            / today.daysInYear
	        ) * 100
            console.log("value", value)
            break;
        case "year":
            value = today.month / 12 * 100
            break;
        case "month":
            value = today.day / today.daysInMonth * 100
            break;
        case "day":
            value = today.hour / 24 * 100
            break;
    }
    return `<progress value="${parseInt(value)}" max="100"></progress> | ${parseInt(value)} %`
}
dv.span(`
| 🌺 | Progress  | Percentage |
| --- | --- |:---:|
| **year** | ${progress("year")}
| **month**| ${progress("month")}
| **day**| ${progress("day")}
| **🎂** | ${progress("lifespan")}
`)
```

> fQtomvCMszvQpNlxQJpsDFILeaoFFafC0oCTHXpjWva
>
> > QIKBnw0bV`button-daily`
>
> > uoHhVJ5wL`button-thisweek`
>
> > 2mNsoUIMu`button-thismonth`
>
> > 4FLndOgb9`button-reload`

> uc7QlkrIR85csgxZrQgDYUsil5XwE<h2 align="center">4NnhqH8CjoRb6npC9lki9LFYg6FvE✨</h2>
>
> ```dataview
> TABLE file.cday as Created, file.mtime as Modified, file.path as Folder
> ```

RPr3Hlq8ZJ9th0ru5WHee7EY4F0mrhAl4Dbfpk2IXgA8lKTX4nZRqHmEa8rjrPasilDglQ7PhK9StBW8QHfZ0NQ8VDL8YeBWoev6EWMHvMFihP5bq28o8cTV7

> ```
> ```

***

> stbc0g3eEtkvsmf3ZGw8rrnHlIiEuz9CjUR9LFGguF
>
> > sxGVjylAXA0nJ46BniCXcyew21[[01 - animation/01 - animation|Animation]]
> >
> > * PQVvvjQVD4[[01 - creative/01 - animation/01 - Diamond Head/01 - Diamond Head|Diamond Head]]
> >   * LJKDafbhbbzjoLfS[[10 - musical animatics|animated music videos]]
> > * 3YDFx2eJblEZE[[20 - The Owl House|The Owl House]]
>
> > aMiQF6uV1xU7s9Xf5voRp9AY4jvnBgWNsEZ2Xls[[02 - drawings/02 - drawings|Drawings]]
> >
> > * [n3XAV8MQ](file:///C:/Users/Corinthe/Desktop/ART)
> > * BM6RYaFPLQw
>
> > tgfLJEp9lit8IWaTtUw4PDffwW6m3VZEH0lC[[03 - writing/03 - writing|Writing]]
> >
> > * [[01 - creative/03 - writing/01 - Diamond Head/01 - Diamond Head|Diamond Head]]
> > * [[01 - creative/03 - writing/02 - Children of Bodom/02 - Children of Bodom|Children of Bodom]]
>
> > 4j547dnEQ2csNv5KgNntQnO7NBFFBQR[[04 - Alternate Universes|Alternate Universes]]BVuEwgir27rOY4SZDFPV53C
> >
> > * [[10 - that one medieval thing|that one medieval thing]]
> >
> > Hy6BeEwwQSZsp9mJ9Y9FofybKObkCP
> >
> > * [[10 - The Reaper House|the reaper house]]

***

<h1 align="center">:far_clipboardlistcheck: Projects</h1>

> pHykkQL0BfJFrUH
>
> ```dataviewjs
> ```

9o2kVD87imNNiVcQkMz6s2D9rBXGSrxZevcj9qYJgp53sDwtgA9lbKKfWLEXiXH7BS9US1omcrI8X5X1L3Mw

> ```
> ```

***
