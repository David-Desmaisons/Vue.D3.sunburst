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
    nodes: {
      required: false,
      type: Object
    },
    /**
     *  Sunburst nodes. Typically provided by sunburst default slot.
     */
    actions: {
      required: true,
      type: Object
    }
  },

  render() {
    //no rendering
  },

  watch: {
    "nodes.mouseOver": function(node) {
      if (!node) {
        this.actions.resetHighlight();
        return;
      }

      this.actions.highlightPath(node);
    }
  }
};
