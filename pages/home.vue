<router>
  {
    path: '/:l1/:l2',
  }
</router>
<template>
  <div class="home main-dark">
    <SocialHead
      :title="`Language Player ${$l2.name}`"
      :description="`Learn ${$l2.name} language from zero to fluency with ${
        ['zh', 'en'].includes($l2.code) ? 'online courses and ' : ''
      } comprehensible input.`"
      :image="image"
    />
    <div class="container pt-2 pb-5">
      <div class="row">
        <div class="col-sm-12">
          <!-- <Sale class="mt-4 mb-4" v-if="$l2.code === 'zh'" /> -->
          <Nav :l1="$l1" :l2="$l2" variant="page" class="pb-2" />
          <div :class="{ 'pl-1 pr-1 pb-2': true }" v-if="$l2.identicalLangs">
            <div class="home-card bg-success">
              <LazyIdenticalLanguages
                routeName="home"
                style="padding: 0; background: none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Helper from "@/lib/helper";
export default {
  data() {
    return {
      hasDashboard: false,
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
    features() {
      return [
        {
          title: "TV Shows",
          icon: "fas fa-tv",
          name: "tv-shows",
        },
      ];
    },
    image() {
      return Helper.background(this.$l2);
    },
  },
  mounted() {
    let name = "explore-media";
    if (this.$l1.code === "en" && this.$l2.code === "zh")
      name = "courses";
    if (this.$l1.code === "zh" && this.$l2.code === "en")
      name = "courses";
    this.$router.push({ name });
  },
  methods: {
    hasDashboardUpdate(hasDashboard) {
      if (hasDashboard && hasDashboard.includes("items")) {
        this.hasDashboard = true;
      }
    },
    redirectToCourses() {
      if (
        this.$l1 &&
        this.$route.params.l1 === this.$l1.code &&
        this.$l2 &&
        this.$route.params.l2 === this.$l2.code
      ) {
        if (this.$hasFeature("courses")) {
          this.$router.push({ name: "courses" });
        }
      }
    },
    hasTalks() {
      return (
        typeof this.$store.state.shows.talks !== "undefined" &&
        this.$store.state.shows.talks[this.$l2.code]
      );
    },
    hasTVShows() {
      return (
        typeof this.$store.state.shows.tvShows !== "undefined" &&
        this.$store.state.shows.tvShows[this.$l2.code]
      );
    },
    f() {
      if (this.$hasFeature("youtube")) {
        let name = "youtube-browse";
        if (this.hasTalks()) name = "talks";
        if (this.hasTVShows()) name = "tv-shows";
        this.$router.push({ name });
      } else if (
        this.$hasFeature("dictionary") ||
        this.$hasFeature("transliteration")
      ) {
        this.$router.push({ name: "reader" });
      } else {
        this.$router.push({ name: "learning-path" });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
#zerotohero.zerotohero-wide {
  .home {
    padding-left: 2rem;
    padding-right: 2rem;
    background: rgba(0, 0, 0, 0.7);
  }
}
.home-card {
  border-radius: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.226);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.8);
}
@media (max-width: 540px) {
  .home-card {
    padding: 2rem 1rem;
    :deep(.history-item-column.col-12) {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
}
.home-intro-text {
  font-family: pacifico;
  font-size: 2.5em;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  color: white;
  padding: 0 2rem 2rem 2rem;
  text-align: center;
}
</style>
