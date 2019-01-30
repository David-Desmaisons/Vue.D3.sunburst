<template>
  <div class="infornation-sunburst" v-if="percentage">
    <span>{{percentage}}</span><br/> {{description}}
  </div>
</template>
<script>
/**
 * Component that display the percentage value of the current node relative to root.
 * Can be used as a "top" slot of sunburst component.
 */
export default {
  name: "nodeInfoDisplayer",
  props: {
    /**
     *  Root node
     */
    root: {
      required: false,
      type: Object
    },
    /**
     *  Current node
     */
    current: {
      required: false,
      type: Object
    },
    /**
     *  Text to be displayed
     */
    description: {
      required: true,
      type: String
    }
  },
  computed: {
    /**
     * @private
     */
    percentage() {
      if (this.current == null || this.root == null) {
        return null;
      }

      const percentage = (100 * this.current.value) / this.root.value;
      return `${percentage.toPrecision(3)} %`;
    }
  }
};
</script>
<style lang="less" scoped>
.infornation-sunburst {
  width: 300px;
  height: 100px;
  padding: 20px;
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 10;
  margin-left: -150px;
  margin-top: -70px;

  span {
    font-size: 2em;
  }
}
</style>
