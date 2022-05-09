export function set(name, value) {
  window.localStorage.setItem(name, JSON.stringify(value));
}

export function get(name, substr) {
  return JSON.parse(window.localStorage.getItem(name) || substr);
}

export function del(name) {
  localStorage.removeItem(name);
}
