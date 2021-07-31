/**
 * Renderless component providing pop-up display on mouse over behavior.
 * Can be used as a default slot of sunburst component.
 */
export default {
  name: "popUpOnHover",
  props: {
    /**
     *  Sunburst event listener. Same as component $on method.
     */
    on: {
      required: true,
      type: Function
    },
    /**
     *  Sunburst nodes. Typically provided by sunburst default slot.
     */
    actions: {
      required: true,
      type: Object
    }
  },

  render: () => null,

  created() {
    const { on, actions } = this;
    on("mouseOverNode", ({ node, center }) => {
      if (center) {
        actions.closeContextMenu();
        return;
      }
      actions.setContextMenu(node);
    });

    on("mouseLeave", () => {
      actions.closeContextMenu();
    });

    on("clickNode", () => {
      actions.closeContextMenu();
    });
  }
};
