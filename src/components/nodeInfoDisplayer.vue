<template>
  <div class="info" v-if="percentage">
    <span>{{percentage}}</span><br/> {{description}}
  </div>
</template>
<script>
export default {
  props: {
    nodes: {
      required: false,
      type: Object
    },
    description: {
      required: true,
      type: String
    }
  },
  computed: {
    percentage() {
      if (this.nodes.mouseOver == null || this.nodes.root == null) {
        return null;
      }

      return `${(
        100 *
        this.nodes.mouseOver.value /
        this.nodes.root.value
      ).toPrecision(3)} %`;
    }
  }
};
</script>
<style lang="less" scoped>
.info {
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
