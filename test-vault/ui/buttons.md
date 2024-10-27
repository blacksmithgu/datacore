```datacorejsx
return function View() {
	const [count, setCount] = dc.useState(0)
	return (<div data-testid="button-outer" style={{textAlign: "center"}}>
		count is: {count}<br/>
		<dc.Button className="mod-cta" onclick={() => setCount(c => c + 1)}>
			click me!
		</dc.Button>
	</div>)
}
```

