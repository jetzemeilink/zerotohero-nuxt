<template>
  <div class="review-wrapper" v-observe-visibility="visibilityChanged">
    <div>
      <Review
        v-for="(reviewItem, reviewItemIndex) in reviewFiltered"
        :key="`review-${reviewItemIndex}`"
        v-bind="reviewItem"
        :hsk="hsk"
        :skin="skin"
      />
      <!-- <div class="text-center mt-2" v-if="review.length > 1">
        <span
          class="d-inline-block"
          style="
            position: relative;
            bottom: 0.13rem;
            font-weight: normal;
            opacity: 0.5;
            font-size: 0.8em;
            cursor: pointer;
          "
        >
          <span v-if="!reviewOpen" @click="reviewOpen = true">
            <i class="fa fa-chevron-down mr-1"></i>
            Show More Questions
          </span>
          <span v-if="reviewOpen === true" @click="reviewOpen = false">
            <i class="fa fa-chevron-up mr-1"></i>
            Show Fewer Questions
          </span>
        </span>
      </div> -->
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Helper from "@/lib/helper";

export default {
  props: {
    lines: {
      type: Array,
    },
    matchedParallelLines: {
      type: Array,
    },
    hsk: {
      type: [Number, String],
    },
    skin: {
      default: "light",
    },
  },
  data() {
    return {
      active: false, // activate only when visible the first time
      review: [],
      reviewOpen: true,
    };
  },
  computed: {
    ...mapState("savedWords", ["savedWords"]),
    ...mapState("settings", ["l2Settings"]),
    l2SettingsOfL2() {
      let l2SettingsOfL2 = {}
      if (this.l2Settings && this.l2Settings[this.$l2.code]) l2SettingsOfL2 = this.l2Settings[this.$l2.code]
      return l2SettingsOfL2
    },
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    quiz() {
      if (typeof this.l2SettingsOfL2 !== "undefined")
        return this.l2SettingsOfL2.showQuiz;
      else return false;
    },
    reviewFiltered() {
      let reviewFiltered = this.review.slice(
        0,
        this.reviewOpen ? this.review.length : 1
      );
      return reviewFiltered;
    },
  },
  beforeDestroy() {
    if (this.unsubscribe) this.unsubscribe();
  },
  created() {
    this.unsubscribe = this.$store.subscribe((mutation) => {
      this.updateReview(mutation);
    });
  },
  methods: {
    /**
     * Generate review items during initial load.
     */
    async visibilityChanged(visible) {
      if (visible) {
        if (
          !this.active &&
          this.savedWords &&
          this.savedWords[this.$l2.code] &&
          this.review.length === 0
        ) {
          this.review = await this.generateReview();
        }
        this.active = true;
      }
    },
    async generateReview() {
      let reviewItems = [];
      for (let savedWord of this.savedWords[this.$l2.code]) {
        let word = await (await this.$getDictionary()).get(savedWord.id);
        if (word) {
          reviewItems = reviewItems.concat(
            await this.reviewItemsForWord(word, savedWord.forms)
          );
        }
      }
      return reviewItems;
    },
    reviewConditions(lineIndex, form, word) {
      let line = this.lines[lineIndex];
      if (["en", "ru"].includes(this.$l2.code)) {
        return line.line.includes(form);
      }
      if (
        (this.$l2.continua || this.$l2.agglutinative) &&
        line.line.includes(form)
      )
        return true;
      if (
        this.$l2.han &&
        (line.line.includes(word.simplified) ||
          line.line.includes(word.traditional))
      )
        return true;
      if (!this.$l2.continua) {
        form = Helper.escapeRegExp(form);
        let found = false;
        try {
          found =
            new RegExp(`[ .,:!?]${form}[ .,:!?]`, "gi").test(line.line) ||
            new RegExp(`^${form}[ .,:!?]`, "gi").test();
        } catch (err) {}
        return found;
      }
    },
    async reviewItemsForWord(word, wordForms) {
      let reviewItems = [];
      let forms = wordForms.filter((form) => form && form !== "-");
      forms = Helper.uniqueIgnoreCase(forms);
      for (let form of forms.sort((a, b) => b.length - a.length)) {
        for (let lineIndex in this.lines) {
          if (this.reviewConditions(lineIndex, form, word)) {
            let reviewItem = await this.generateReviewItem(
              lineIndex,
              form,
              word
            );
            reviewItems.push(reviewItem);
          }
        }
      }
      return reviewItems;
    },
    async generateReviewItem(lineIndex, form, word) {
      let line = this.lines[lineIndex];
      let parallelLines = this.matchedParallelLines
        ? this.matchedParallelLines[lineIndex]
        : undefined;
      return {
        line,
        lineIndex,
        parallelLines,
        text: form,
        word,
        simplified: word.simplified,
        traditional: word.traditional,
      };
    },
    async updateReview(mutation) {
      if (mutation.type === "savedWords/LOAD") {
        if (this.review.length === 0) this.review = await this.generateReview()
      }
      if (mutation.type === "savedWords/ADD_SAVED_WORD") {
        this.review = this.review.concat(
          await this.reviewItemsForWord(
            mutation.payload.word,
            mutation.payload.wordForms
          )
        );
      } else if (mutation.type === "savedWords/REMOVE_SAVED_WORD") {
        this.review = this.review.filter(
          (reviewItem) => mutation.payload.word.id !== reviewItem.word.id
        );
      }
    },
  },
};
</script>

<style>
</style>