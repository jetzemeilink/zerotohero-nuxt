<template>
  <div class="language-info-box">
    <client-only>
      <WebImages
        v-if="lang && showImages"
        :text="`${lang.name} people${
          (!lang.speakers || lang.speakers < 500000) &&
          lang.country &&
          lang.country[0]
            ? ' ' & lang.country.map((c) => c.name).join(' or ')
            : ''
        }`"
        limit="3"
        ref="images"
        class="language-info-box-images"
      />
    </client-only>
    <div class="language-info-box-wikipedia" v-if="page">
      {{ wikipediaSummary }}
      <div>
        <i class="fa-solid fa-arrow-right"></i>
        Learn more on
        <a
          target="blank"
          :href="page.url()"
          class="link-unstyled font-weight-bold text-success"
          style="text-decoration: underline"
        >
          Wikipedia
        </a>
      </div>
      <div v-if="lang.omniglot">
        <i class="fa-solid fa-arrow-right"></i>
        Learn useful phrases on
        <a
          target="blank"
          class="link-unstyled font-weight-bold  text-success"
          style="text-decoration: underline"
          :href="`https://omniglot.com/writing/${lang.omniglot}`"
        >
          Omniglot
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import wiki from "wikijs";

export default {
  props: {
    lang: {
      type: Object,
    },
    showImages: {
      type: Boolean,
      default: true,
    },
    brief: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      wikipediaSummary: undefined,
      page: undefined,
    };
  },
  computed: {
    $l1() {
      return this.$store.state.settings.l1;
    },
    $l2() {
      return this.$store.state.settings.l2;
    },
  },
  async mounted() {
    if (this.lang) {
      try {
        let page = await wiki({
          apiUrl: `https://${this.$l1.code}.wikipedia.org/w/api.php`,
        }).page(`${this.lang.name} language`);
        this.page = page;
        let summary = await page.summary();
        let shortSummary = summary
          .split("\n")[0]
          .replace(/\(.*?\)/g, "")
          .replace(/[()]/g, "")
          .replace(/(.*?\. .*?\. .*?\. .*?\. .*?\. .*?\.) .*/, "$1 . . .");
        if (this.brief) shortSummary = shortSummary.replace(/(.*?\. ).*/, "$1");
        this.wikipediaSummary = shortSummary;
      } catch (err) {}
    }
  },
};
</script>

<style lang="scss" scoped>
.language-info-box-images {
  justify-content: center;
  :deep(.image-wall-image) {
    flex: 0;
    margin-right: 1rem;
    margin-bottom: 1rem;
    background: white;
    border-radius: 0.25rem;
  }
}
</style>