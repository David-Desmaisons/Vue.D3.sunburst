/**
 * Renderless component providing the zoom on click behavior.
 *Can be used as a default slot of sunburst component.
 */
export default {
  name: "zoomOnClick",
  props: {
    /**
     *  Sunburst nodes. Typically provided by sunburst default slot.
     */
    nodes: {
      required: false,
      type: Object
    },
    /**
     *  Sunburst actions. Typically provided by sunburst default slot.
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
    "nodes.clicked": function(node) {
      this.actions.zoomToNode(node);
    }
  }
};
