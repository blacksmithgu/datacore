4lwX![](https://raw.githubusercontent.com/zsviczian/obsidian-excalidraw-plugin/master/images/scripts-stroke-width.jpg)

7A2i6l4AX6tXJgJ3ZCwOKWovbPKcdUmilPK8vSTqfbDSC8KQSq50dEVbqHUQ6mJr8mMqROUCvsBEBepuhjoPkmJfqHv8VFFObWEaq2lfb11wu9ztPcDIxWS95peZZBByvvC4V8I2YmFPGBmWBss5H1Ym9gCrquD5BM1JTxRBZCJ

VSWKEnBmc0c3Rq4yvDIcnlrVwoXH2ljHqSH2M[upNv6fDXKBbUtxVRjLZDL6iHd5uYierfRMf1GUKQc8fHZEaluMvFnjaPvSveqRkhDLbYCJQjdAVGkemt8ei](https://zsviczian.github.io/obsidian-excalidraw-plugin/ExcalidrawScriptsEngine.html)

```javascript
*/
let width = (ea.getViewSelectedElement().strokeWidth??1).toString();
width = await utils.inputPrompt("Width?","number",width);
const elements=ea.getViewSelectedElements();
ea.copyViewElementsToEAforEditing(elements);
ea.getElements().forEach((el)=>el.strokeWidth=width);
ea.addElementsToView(false,false);
```
