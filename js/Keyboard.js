import * as storage from "./Storage.js";
import create from "./utils/create.js";
import language from "./layouts/index.js";
import Key from "./Key.js";

const main = create("main", "", [
  create("h1", "title", "RsSchool virtual-keyboard"),
  create(
    "h2",
    "subtitle",
    "the task was completed in the operating system Windows"
  ),
  create("p", "hint", "To change the language, use Shift + Alt"),
]);

export default class Keyboard {
  constructor(rowsOrder) {
    this.rowsOrder = rowsOrder;
    this.keyPressed = {};
    this.isCaps = false;
  }

  init(code) {
    this.keyBase = language[code];
    this.output = create(
      "textarea",
      "output",
      null,
      main,
      ["placeholder", "Input somethings"],
      ["rows", 5],
      ["cols", 50],
      ["spellcheck", false],
      ["autocorrect", "off"]
    );
    this.container = create("div", "keyboard", null, main, ["language", code]);
    document.body.prepend(main);
    return this;
  }

  generateLayout() {
    this.keyButtons = [];
    if (!this.rowsOrder.length) {
      throw new Error("Error");
    }
    this.rowsOrder.forEach((row, i) => {
      const rowElement = create("div", "keyboard__row", null, this.container, [
        "row",
        i + 1,
      ]);
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`
      row.forEach((code)=>{
        const keyObj = this.keyBase.find((key)=>key.code===code);
        if(keyObj){
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div)
        }
      })
    });

  }
}
