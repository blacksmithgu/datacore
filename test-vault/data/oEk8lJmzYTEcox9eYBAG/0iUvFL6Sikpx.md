---
links:
  - "[[Untitled 1.canvas|Untitled 1]]"
  - "[[Big Fish.fountain]]"
  - "[[root/Untitled]]"
---

```yaml:data
this: is
some: inline
metadata:
  - one
  - two
  - three
  - "[[Big Fish.fountain]]"
  - "[[brick&steel.fountain]]"
  - lol
```

```datacoretsx
const randProg = () => Math.random() * 100
function SpeshulTable(props) {
	let res = dc.useQuery(`@task and $parentLine < 0 and !contains($file, "series bible") and !contains($file, "periodic notes") and !contains($file, "kanban") and !contains($file, "template")`, {debounce: 0});
	let sorted = dc.useMemo(() => {
		return res.sort((a, b) => {
			let aa = a.$file.split("/").toReversed()[0];
			let bb = b.$file.split("/").toReversed()[0];
			return aa > bb ? 1 : bb > aa ? -1 : 0;
		})
	}, [res])
	let groups = dc.useMemo(() => {
		let groups = {}
	 		sorted.map(x => x.$file).filter((b, ind, arr) => ind === arr.indexOf(b)).forEach(x => {
	 			groups[x] = sorted.filter(y => y.$file === x)
	 		})
	 	return groups;
	}, [sorted, res])
 	let el =  dc.useMemo(() => {
 		
 		
 		return <div style={{ display: "grid", gridTemplateColumns: `repeat(${props.gridSize}, minMax(0, 1fr))`, justifyItems: "stretch", alignItems: "stretch", gap: "0.75em"}}>
 			{Object.keys(groups).map(x => (		
 				<dc.Card title={x.split("/").toReversed()[0]} centerTitle collapsible value={groups[x]} content={v2 => (<dc.TaskList rows={v2} states={["/", "x", " "]} displayedFields={[
 						{
 							key: "completed",
 							defaultValue: null,
 							type: "date"
						},
						{
							key: "percentDone",
							defaultValue: randProg,
							type: "number",
							renderAs: "progress"
						}
					]} />)
				}/>
			))}
		</div>
	}, [sorted, groups, res])
	return el
}

return (<dc.Callout collapsible type="outline" initialOpen={false} title={<h6 style={{color: "#a3fffd", alignSelf: "start"}}>task demo</h1>}>
	<SpeshulTable gridSize={1}/>
</dc.Callout>)

```

```datacorejsx

//console.clear()

function IAmOld({children, fac}) {
	const div = function div(a, b) { return a / b }
	const mul = function mul(a, b) { return a * b }
	const [age, setAge] = dc.useState(-Infinity);

	const [pdir, setPdir] = dc.useState(0)
	const [paused, setPaused] = dc.useState(true)
	const [dir, setDir] = dc.useState(-1)
	const prevo = (val) => {
		setPdir(dir);
		setDir(val);
	}
	const fn = (paused) => {
		if(paused) return;
		//console.log("aaaa", age)
		if(pdir == 0) prevo(dir)
		else if(age == Infinity) {
			//console.log(-1)
			prevo(-1)
		} else if(age == -Infinity) {
			//console.log(1)
			prevo(1)
		} 
	
		let nage = (age == Infinity ? Number.MAX_VALUE : age == -Infinity ? 0-Number.MAX_VALUE : age)
		
		if(dir < 0 && nage == 0) {
			//prevo(1);
			nage -= 1
		}	else if(dir > 0 && nage == 0) {
			nage += 1
		}
		let op = mul;
		if(nage < 0) {
			if(dir == -1) {
				op = mul
			} else if(dir == 1) {
				op = div
			}
		} else if(nage > 0) {
			if(dir == -1) {
				op = div
			} else if(dir == 1) {
				op = mul
			}
		}
		
		//console.log(nage)
		let res = op(nage.toFixed(), fac)
		if(res == -1) {
			res = res + 1;
		} else if(res == 1) {
			res = res - 1
		} else if((res <= 1 && res > 0) || (res >= -1 && res < 0)) {
			res = 0;
		}
		setAge(res);
	}
	dc.useEffect(() => {
		const t = setInterval(() => fn(paused), 500)
		return () => {
			//console.log("clearing")
			clearInterval(t)
		}
	}, [age, dir, pdir])
	return (
		<div>
			{children}
			<br/>
			<button onClick={() => fn(false)}>clicketh</button>
			<button onClick={() => setPaused(!paused)}>pause: {paused.toString()}</button>
			<br/>
			<sub>
				<br/>
				{`i am ${age} years old !`}
			</sub>
		</div>
	)
}
let elo = <dc.Markdown content="# **greetings universe !**" sourcePath={dc.currentPath()}/>
let cardo = <dc.Card 
	title="hello world"
	centerTitle
	collapsible
	collapsed
	content={<dc.Markdown sourcePath={dc.currentPath()} content={`this is **content**
>[!gimme an embed]-
> ![[un]]`}
	/>}
/>

let ph = <IAmOld fac={16}>
	{elo}
</IAmOld>

let pdf = <dc.Embed linkText="gafbp.pdf"	sourcePath={dc.currentPath()} extension="pdf" inline={false}/>
return [cardo, pdf, ph]
//dc.render(cardo)
//dc.addChild(cardo)
```

> eGhhm8xNWNFSTbyLSGkcWVO32DJTImrlgFRs7MDhGb7jkxdT5dEUQbYV4RtLFgBZchzB89EOl5oh0E5o2eUhuqbKOsf4wb4IxqqJI5UvYrobuSGGNnAwBf104O14Orwck3XbLg8iW2wFb0V1X9VtYjHA71FeEsZ9qVcQU5aKnR7yF0VwVWw1EL39HDZ8jNWBUlZ4XHV7KuoPbQLey62v4SxABsP6T0WWBc91W9UDJpdp7O0yhjJXTe2UvQ0XLWmsMvYoPQ

```datacorejsx
function Foo() {
	const file = dc.useCurrentFile()
	return <div>stub !</div>
}
return <Foo/>
```

OSW06

```datacorejsx
return function TableThing() {
	const query = dc.useQuery(`@task and $parentLine < 0 and contains($file, "projects")`)
	const props = {
		filterable: true,
		rows: query,
		columns: [{
			id: "id",
			title: "ID",
			value: (o) => o.$id
		},
		{
			id: "completed",
			title: "completed",
			value: (o) => o.$completed
		}],
		paging: 10
	}
	return (<>
		<h1>{query.length}</h1>
		<dc.VanillaTable {...props}/>
	</>)
}
```

[[gafbp.pdf]]

* [x] viYyuGN**a**3k\[ratingtest:: 5] \[seltest:: 3] \[btfash:: true] \[multitest:: 1, 3] \[completed:: June 30, 2024]
* [x] IJHlhe2OtX59hyS17nOxv49hb0fLrZrqn7psVlYcb\[completed:: June 28, 2024] \[btfash:: true] \[seltest:: 6]

```datacorejsx

function Maybe() {
	const cfc = dc.useCurrentFile().$file
	const q = dc.useQuery(dc.parseQuery(`@task and $file = "${cfc}"`), {debounce: 0})
	//console.log(q[0]?.$completed, q[0]?.$symbol, q[0]?.$infields, q[0]?.fields)
	let props = dc.useMemo(() => ({
		rows: q,
		displayedFields: [
			{
				key: "ratingtest",
				type: "number",
				renderAs: "rating",
				defaultValue: 1
			},
			{
				key: "btfash",
				type: "boolean",
				defaultValue: true
			},
			{
				key: "seltest",
				type: "string",
				defaultValue: "1",
				renderAs: "select",
				config: {
					options: "brian tatler fucked and abused sean harris!!!!!!!!!!!!!!!".split(" ").map((x, i) => {
						return {
							value: `${i + 1}`,
							label: `${x}`
						}
					})
				}
			},
			{
				key: "multitest",
				type: "string",
				renderAs: "select",
				config: {
					options: "yksi kaksi kolme nelja viisi kuusi seitseman kahdeksan yhdeksan kymmenen".split(" ").map((x, i) => ({
						value: i + 1,
						label: x
					})),
					multi: true
				}
			},
			{
				key: "completed",
				type: "date"
			}
		]
	}), [q, cfc])
	return <dc.TaskList {...props} />
}
return <dc.Card content={() => <Maybe/>} />
```

\[mmtest::]
