import { DatacoreLocalApi } from "./local-api";

/**
 * Evaluate a script where 'this' for the script is set to the given context. Allows you to define global variables.
 */
export function evalInContext(script: string, context: DatacoreLocalApi): any {
	return function () {
			return eval(script);
	}.call(context);
}

/**
* Evaluate a script possibly asynchronously, if the script contains `async/await` blocks.
*/
export async function asyncEvalInContext(script: string, context: DatacoreLocalApi): Promise<any> {
	script = `const dataview = this;const dv = this;\n${script}`
	if (script.includes("await")) {
			return evalInContext("(async () => { " + script + " })()", context) as Promise<any>;
	} else {
			return Promise.resolve(evalInContext(script, context));
	}
}