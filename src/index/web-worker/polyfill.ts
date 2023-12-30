function objNoop() {
	return {}
}
function noop() {}

export const document = {
	createElement: objNoop,
	append: noop,
	head: {
		append: noop,
		createElement: objNoop
	},
}