export default function create(el, classNames = "", child, parent, ...dataAttr) {
  let element = null;

  try {
    element = document.createElement(el);
  } catch (error) {
    throw new Error("Unable to create HTML-element. Change a tag-name");
  }

  if (classNames) {
    element.classList.add(...classNames.split(" "));
  }
  if (child && Array.isArray(child)) {
    child.forEach((childEl) => {
      childEl && element.appendChild(childEl);
    });
  } else if (child && typeof child === "object") {
    element.appendChild(child);
  } else if (typeof child === "string") {
    element.innerHTML = child;
  }

  if (parent) {
    parent.appendChild(element);
  }

  if (dataAttr.length) {
    dataAttr.forEach(([attrName, attrValue]) => {
      if (attrValue === "") {
        element.setAttribute(attrName, "");
        return;
      }
      if (
        attrName.match(/value|id|placeholder|cols|rows|autocorrect|spellcheck/)
      ) {
        element.setAttribute(attrName, attrValue);
      } else {
        element.dataset[attrName] = attrValue;
      }
    });
  }
  return element;
}
