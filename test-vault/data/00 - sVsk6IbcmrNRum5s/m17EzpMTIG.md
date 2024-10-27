```dataviewjs
const today = DateTime.now()
const endOfYear = {
    year: today.year,
    month: 12,
    day: 31
}
const lifespan = { year: 80 } 
const birthday = DateTime.fromObject({
    year: today.year,
    month: 8,
    day: 11
});
const lastbirthday = birthday.minus({year: 1})
console.log(birthday, lastbirthday)
console.log(today.diff(lastbirthday))
function progress(type) {
    let value;
    switch(type) {
        case "lifespan": 
            // console.log(lastbi)
            value = ((today.diff(lastbirthday)).as("days") / today.daysInYear) * 100
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
