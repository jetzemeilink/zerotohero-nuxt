<template>
  <div>
    <b-form-input
      type="text"
      v-model="newShowTitle"
      :lazy="true"
      placeholder="Title"
      size="sm"
    />
    <b-button
      class="btn btn-small mt-2 ml-0 bg-success text-white"
      size="sm"
      @click="addShow()"
    >
      Save {{ type === "tv-shows" ? "Show" : "Talk" }}
    </b-button>
  </div>
</template>

<script>

export default {
  props: {
    youtube_id: String,
    defaultTitle: String,
    type: {
      default: "tv-shows",
      type: String,
    },
  },
  data() {
    return {
      newShow: false,
      newShowTitle: this.defaultTitle,
      newShowYear: undefined,
      newShowL1Title: undefined,
    };
  },
  computed: {
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
  },
  methods: {
    async addShow() {
      let show = {
        youtube_id: this.youtube_id,
        title: this.newShowTitle,
        l2: this.$l2.id,
      };
      if (this.newShowYear) show.year = this.newShowYear;
      show = await this.$store.dispatch("shows/add", {
        l2: this.$l2,
        type: this.type === "tv-shows" ? "tvShows" : "talks",
        show,
      });
      if (show) {
        this.$emit("newShow", show);
      }
    },
  },
};
</script>

<style>
</style>