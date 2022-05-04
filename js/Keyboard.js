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

  switchUpperCase(isTrue, isShiftKey) {
    if (isTrue) {
      if (!this.isCaps) {
        this.shiftKey = true;
      }
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          if (!this.isCaps || (this.isCaps && isShiftKey)) {
            button.sub.classList.add("sub-active");
          }
          if (!this.isCaps || (this.isCaps && isShiftKey)) {
            button.letter.classList.add("sub-inactive");
          }
          if (
            !button.isFnKey &&
            button.shift &&
            button.shift.match(/[a-zA-Zа-яА-ЯёЁ0-9]/i)
          ) {
            button.letter.innerHTML = button.shift;
          }
        }
      });
    } else {
      this.shiftKey = false;
      this.keyButtons.forEach((button) => {
        if (button.sub) {
          button.sub.classList.remove("sub-active");
          button.letter, classList.remove("sub-inactive");
          if (!button.isFnKey && !button.sub.value && !this.isCaps) {
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
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
          this.changeLanguage();
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

  resetButtonState = (e) => {
    this.resetPressedButtons(e.target.dataset.code);
  };

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

  resetPressedButtons = (targetCode) => {
    const pressed = Object.keys(this.keyPressed);
    clearTimeout(this.timeOut);
    clearInterval(this.interval);
    pressed.forEach((code) => {
      if (
        targetCode &&
        targetCode === code &&
        this.keyPressed[code].small === "Shift"
      ) {
        this.shiftKey = false;
        this.switchUpperCase(false);
        delete this.keyPressed[code];
        if (this.keyPressed[code]) {
          this.keyPressed[code].div.classList.remove("active");
        }
      } else if (code === targetCode || code.match(/Alt/)) {
        this.keyPressed[code].div.classList.remove("active");
        delete this.keyPressed[code];
      }
    });
  };
}


changeLanguage = () => {
  const langAbr = Object.keys(language);
  let langIndex = langAbr.indexOf(this.container.dataset.language)
  this.keyBase = langIndex + 1 < langAbr.length ? language[lang[++langIndex]] : language[langAbr[(langIndex -= langIndex)]];

  this.container.dataset.language = langAbr[langIndex];
  storage.set("kbLang", langAbr[langIndex]);

  this.keyButtons.forEach((button) => {
    const keyObj = this.keuBase.find((key) => key.code === button.code);
    if (!keyObj) {
      return
    } button.shift = keyObj.shift;
    button.small = keyObj.small;
    if (keyObj.shift && keyObj.shift.match(/[^a-zA-Zа-яА-ЯёЁ0-9]/g)) {
      button.sub.innerHTML = keyObj.shift
    } else {
      button.sub.innerHTML = "";
    }
    button.letter.innerHTML = keyObj.small;
    if (!button.isFnKey) {
      button.letter.classList.toggle("changed")
    }
  })
  if (this.isCaps) {
    this.switchUpperCase(true)
  }
}

