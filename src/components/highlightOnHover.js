export default {
  props: {
    /**
     *  Sunburst nodes
     */
    nodes: {
      required: false,
      type: Object
    },
    /**
     *  Sunburst actions
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
