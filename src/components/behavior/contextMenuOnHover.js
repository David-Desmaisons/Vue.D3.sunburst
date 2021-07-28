/**
 * Renderless component providing path context menu on mouse over behavior.
 * Can be used as a default slot of sunburst component.
 */
export default {
  name: "contextMenuOnHover",
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
    on("mouseOverNode", ({ node, element }) => {
      actions.setContextMenu({ node, element });
    });

    on("mouseLeave", () => {
      actions.closeContextMenu();
    });
  }
};
