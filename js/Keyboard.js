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
      rowElement.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
      row.forEach((code) => {
        const keyObj = this.keyBase.find((key) => key.code === code);
        if (keyObj) {
          const keyButton = new Key(keyObj);
          this.keyButtons.push(keyButton);
          rowElement.appendChild(keyButton.div);
        }
      });
    });
    document.onkeydown = this.processKeyDownEvent;
    document.onkeyup = this.processKeyUpEvent;
    this.container.onmousedown = this.createCustomEvent;
    this.container.onmouseup = this.createCustomEvent;
  }
  processKeyDownEvent = (e) => {
    const { code, ctrlKey, shiftKey } = e;
    this.output.focus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (keyObj) {
      if (!e.type && keyObj.isFnKey && keyObj.small === "Shift") {
        this.shiftKey = true;
      }
      if (e.type && keyObj.isFnKey && keyObj.small === "Shift") {
        this.shiftKey = true;
      }
      if (keyObj.small === "Shift") {
        this.switchUpperCase(true, shiftKey || this.shiftKey);
      }
      if (keyObj.code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (keyObj.code.match(/Caps/) && this.isCaps && !e.repeat) {
        this.isCaps = false;
        this.switchUpperCase(false);
      }
      if (!e.type && keyObj.code.match(/Control/) && keyObj.isFnKey) {
        this.ctrlKey = true;
      }
      if (keyObj.code.match(/Alt/g) && (ctrlKey || this.ctrlKey)) {
        if (e.type) {
          e.preventDefault();
          this.switchLanguage();
        }
      }
      const regexp =
        /Tab|ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i;
      if (
        (!keyObj.isFnKey && !ctrlKey) ||
        keyObj.code.match(/Tab|Alt/) ||
        (!e.type && keyObj.code.match(regexp))
      ) {
        if (e.type) {
          e.preventDefault();
        }
        this.fireKeyPress(
          keyObj,
          (shiftKey && !this.isCaps) ||
            (this.shiftKey && !this.isCaps) ||
            ((shiftKey || this.shiftKey) &&
              this.isCaps &&
              keyObj.sub.innerText) ||
            (this.isCaps && !keyObj.sub.innerText) ||
            (this.isCaps && (this.shiftKey || shiftKey) && keyObj.sub.innerText)
            ? keyObj.shift
            : keyObj.small
        );
      }
      keyObj.div.classList.add("active");
      this.keyPressed[keyObj.code] = keyObj;
      if (!e.type) {
        keyObj.div.addEventListener("mouseleave", this.resetButtonState, {
          once: true,
        });
      }
    }
  };

resetButtonState = (e)=>{
  this.resetPressedButtons(e.target.dataset.code)
}



  processKeyUpEvent = ({ code }) => {
    const keyObj = this.keyPressed[code];
    delete this.keyPressed[code];
    if (keyObj) {
      if (
        !keyObj.code.match(/Caps/) ||
        (keyObj.code.match(/Caps/) && this.isCaps)
      ) {
        keyObj.div.classList.remove("active");
      }
      if (keyObj.isFnKey && keyObj.small === "Shift" && !this.isCaps) {
        this.switchUpperCase(false);
      } else if (keyObj.isFnKey && keyObj.small === "Shift" && this.isCaps) {
        this.shiftKey = false;
        this.switchUpperCase(false, true);
      }
    }
  };
}
