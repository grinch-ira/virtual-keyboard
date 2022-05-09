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
  create("p", "hint", "To change the language, use Ctrl + Alt"),
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
          button.letter.classList.remove("sub-inactive");
          if (!button.isFnKey && !button.sub.value && !this.isCaps) {
            button.letter.innerHTML = button.small;
          }
        }
      });
    }
  }

  processKeyDownEvent = (event) => {
    const { code, ctrlKey, shiftKey } = event;
    this.output.focus();
    const keyObj = this.keyButtons.find((key) => key.code === code);
    if (keyObj) {
      if (!event.type && keyObj.isFnKey && keyObj.small === "Shift") {
        this.shiftKey = true;
      }
      if (event.type && keyObj.isFnKey && keyObj.small === "Shift") {
        this.shiftKey = true;
      }
      if (keyObj.small === "Shift") {
        this.switchUpperCase(true, shiftKey || this.shiftKey);
      }
      if (keyObj.code.match(/Caps/) && !this.isCaps) {
        this.isCaps = true;
        this.switchUpperCase(true);
      } else if (keyObj.code.match(/Caps/) && this.isCaps && !event.repeat) {
        this.isCaps = false;
        this.switchUpperCase(false);
      }
      if (!event.type && keyObj.code.match(/Control/) && keyObj.isFnKey) {
        this.ctrlKey = true;
      }
      if (keyObj.code.match(/Alt/g) && (ctrlKey || this.ctrlKey)) {
        if (event.type) {
          event.preventDefault();
          this.changeLanguage();
        }
      }
      const regexp =
        /Tab|ArrowLeft|ArrowUp|ArrowDown|ArrowRight|Delete|Backspace|Enter/i;
      if (
        (!keyObj.isFnKey && !ctrlKey) ||
        keyObj.code.match(/Tab|Alt/) ||
        (!event.type && keyObj.code.match(regexp))
      ) {
        if (event.type) {
          event.preventDefault();
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
      if (!event.type) {
        keyObj.div.addEventListener("mouseleave", this.resetButtonState, {
          once: true,
        });
      }
    }
  };

  resetButtonState = (event) => {
    this.resetPressedButtons(event.target.dataset.code);
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



  changeLanguage = () => {
    const langAbr = Object.keys(language);
    let langIndex = langAbr.indexOf(this.container.dataset.language)
    this.keyBase = langIndex + 1 < langAbr.length ? language[langAbr[++langIndex]] : language[langAbr[(langIndex -= langIndex)]];

    this.container.dataset.language = langAbr[langIndex];
    storage.set("kbLang", langAbr[langIndex]);

    this.keyButtons.forEach((button) => {
      const keyObj = this.keyBase.find((key) => key.code === button.code);
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

  createCustomEvent = (event) => {
    event.preventDefault();
    const keyDiv = event.target.closest(".keyboard__key");
    if (!keyDiv) {
      return
    }
    const {
      dataset: { code },
    } = event.target.closest(".keyboard__key");

    if (event.type === "mouseup") {
      if (!this.shiftKey) {
        this.shiftKey = !!(code === "ShiftLeft" || code === "ShiftRight")
      }
      if (code.match(/Control/)) {
        this.ctrlKey = false;
      }
      clearTimeout(this.timeOut);
      clearInterval(this.interval);
      this.processKeyUpEvent({ code })
    } else {
      if (!this.shiftKey) {
        this.shiftKey = code === "ShiftLeft" || code === "ShiftRight"
      }
      if (!code.match(/Alt|Caps|Control/)) {
        this.timeOut = setTimeout(() => {
          this.interval = setInterval(() => {
            this.processKeyDownEvent({ code })
          }, 35)
        }, 500)
      }
      this.processKeyDownEvent({ code })
    }
    this.output.focus()
  }

  fireKeyPress(keyObj, symbol) {
    let cursorPosition = this.output.selectionStart;
    const left = this.output.value.slice(0, cursorPosition);
    const right = this.output.value.slice(cursorPosition);
    const textHandlers = {
      Tab: () => {
        this.output.value = `${left}\t${right}`;
        cursorPosition++;
      },
      ArrowLeft: () => {
        cursorPosition = cursorPosition - 1 >= 0 ? cursorPosition - 1 : 0;
      },
      ArrowRight: () => cursorPosition++,
      ArrowUp: () => {
        const positionFromLeft = this.output.value
          .slice(0, cursorPosition)
          .match(/(\n).*$(?!\1)/g) || [[1]];
        cursorPosition -= positionFromLeft[0].length;
      },
      ArrowDown: () => {
        const positionFromLeft = this.output.value
          .slice(cursorPosition)
          .match(/^.*(\n).*(?!\1)/) || [[1]];
        cursorPosition += positionFromLeft[0].length + 1;
      },
      Enter: () => {
        this.output.value = `${left}\n${right}`;
        cursorPosition++;
      },
      Delete: () => {
        this.output.value = `${left}${right.slice(1)}`;
      },
      Backspace: () => {
        this.output.value = `${left.slice(0, -1)}${right}`;
        cursorPosition--;
      },
      Space: () => {
        this.output.value = `${left} ${right}`;
        cursorPosition += 1;
      },
    };
    if (textHandlers[keyObj.code]) textHandlers[keyObj.code]();
    else if (!keyObj.isFnKey) {
      cursorPosition += 1;
      this.output.value = `${left}${symbol || ""}${right}`;
    }
    this.output.setSelectionRange(cursorPosition, cursorPosition);
  }

}


