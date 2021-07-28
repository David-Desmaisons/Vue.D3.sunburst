import { createPopper } from "@popperjs/core";

const updateStateModifier = sendStyle => ({
  name: "updateState",
  enabled: true,
  phase: "write",
  fn: ({ state }) => {
    sendStyle(state);
    return state;
  },
  requires: ["computeStyles"]
});

const sendStyle = callback => {
  return state => callback(state.styles.popper);
};

function customCreatePopper({ target, element, placement, styleCallback }) {
  const onStyle = sendStyle(styleCallback);
  return createPopper(target, element, {
    onFirstUpdate: onStyle,
    placement,
    modifiers: [
      updateStateModifier(sendStyle),
      { name: "applyStyles", enabled: false }
    ]
  });
}

export { customCreatePopper as createPopper };
