/**
 * Renderless component providing path highlighting on mouse over behavior.
 * Can be used as a default slot of sunburst component.
 */
export default {
  name: "highlightOnHover",
  props: {
    /**
     *  Sunburst nodes. Typically provided by sunburst default slot.
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
    const {on, actions} = this;
    on("mouseOverNode", ({node}) =>{
      actions.highlightPath(node);
    });

    on("mouseLeave", () =>{
      actions.resetHighlight();
    });
  }
};
