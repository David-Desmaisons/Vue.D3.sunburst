export default {
  props: {
    nodes: {
      required: false,
      type: Object
    },
    actions: {
      required: true,
      type: Object
    }
  },

  render() {
    //no rendering
  },

  watch: {
    "nodes.mouseOver": function (node) {
      if (!node) {
        this.actions.resetHighlight();
        return;
      }

      this.actions.highlightPath(node);
    }
  }
};
