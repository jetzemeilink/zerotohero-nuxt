<template>
  <div
    :class="{
      'search-subs pb-3': true,
      'search-subs-light': skin === 'dark',
      'search-subs-dark': skin === 'dark',
      fullscreen,
      reels: fullscreen && reels,
    }"
  >
    <div class="text-center pb-2">
      <span v-if="hits.length > 0">
        <b-button
          size="sm"
          :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
          :disabled="hitIndex === 0"
          @click="goToPrevHit"
          title="Previous Clip"
          :class="{ '': true, disabled: hitIndex === 0 }"
        >
          <i class="fas fa-step-backward" />
        </b-button>
        <b-button
          :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
          size="sm"
          v-if="!showFilter"
          title="Filter Clips by Keywords"
          @click="showFilter = true"
        >
          <i class="fas fa-filter" />
        </b-button>
        <b-button
          size="sm"
          :variant="skin === 'dark' ? 'ghost-dark-no-bg' : 'gray'"
          class="playlist-toggle"
          @click="showPlaylistModal"
          title="List All Clips"
        >
          <i class="fa-solid fa-list mr-1"></i>
          List
        </b-button>
        <b-form-input
          v-if="!checking && (hits.length > 0 || regex) && showFilter"
          type="text"
          class="d-inline-block"
          size="sm"
          v-model="regex"
          placeholder="Filter..."
          :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
          :lazy="true"
          :style="`width: 6em`"
          @blur="showFilter = false"
        />
        <span class="search-subs-hit-index ml-2 mr-2 d-inline-block">
          {{ hitIndex + 1 }} of {{ hits.length }}
        </span>
        <router-link
          v-if="currentHit"
          :to="`/${$l1.code}/${$l2.code}/youtube/view/${
            currentHit.video.youtube_id
          }/?t=${currentHit.video.subs_l2[currentHit.lineIndex].starttime}`"
          :class="`btn btn-${
            skin === 'light' ? 'gray' : 'ghost-dark-no-bg'
          } btn-sm `"
          title="Open this video with full transcript"
        >
          <i class="fa-solid fa-arrows-maximize mr-1"></i>
          Open Full
        </router-link>
        <b-button
          size="sm"
          :disabled="hitIndex >= hits.length - 1"
          :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
          @click="goToNextHit"
          title="Next Clip"
          :class="{
            '': true,
            disabled: hitIndex >= hits.length - 1,
          }"
        >
          <i class="fas fa-step-forward" />
        </b-button>
        <div class="float-right mr-1" v-if="$adminMode">
          <SmallStar
            :item="currentHit"
            :saved="(hit) => hit.saved"
            :save="saveHit"
            :remove="removeSavedHit"
            class="ml-0 mr-0"
            style="position: relative; bottom: -0.07em"
          />
          <span
            class="ml-1 mr-0"
            style="
              background: none;
              position: relative;
              bottom: -0.07em;
              opacity: 0.7;
            "
            v-if="groupsRight['zthSaved'].length > 0"
          >
            {{ groupsRight["zthSaved"].length }}
          </span>
          <b-button
            :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
            class="search-subs-fullscreen"
            size="sm"
            @click="toggleFullscreen"
            v-if="
              !checking &&
              !fullscreen &&
              fullscreenToggle &&
              (hits.length > 0 || regex)
            "
          >
            <i class="fas fa-expand"></i>
          </b-button>
          <b-button
            :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
            size="sm"
            class="btn search-subs-close"
            @click="toggleFullscreen"
            v-if="!checking && fullscreen && fullscreenToggle"
          >
            <i class="fas fa-times" />
          </b-button>
          <b-button
            :variant="skin === 'light' ? 'gray' : 'ghost-dark-no-bg'"
            :class="{ active: reels }"
            size="sm"
            @click="reels = !reels"
            v-if="fullscreen"
          >
            <i class="fa-brands fa-instagram"></i>
          </b-button>
        </div>
      </span>
    </div>
    <div
      :class="{ 'loader text-center pb-5 pt-3': true, 'd-none': !checking }"
      style="flex: 1"
    >
      <Loader :sticky="true" message="Searching through video captions..." />
    </div>
    <div class="text-center p-3" v-if="!checking && hits.length === 0">
      <p>Sorry, no hits found.</p>
      <p v-if="$store.state.settings.subsSearchLimit">
        Try turning off ‘Limit “this word in TV Shows” search result (faster)’
        in
        <router-link :to="{ name: 'settings' }">Settings</router-link>
      </p>
      <b-button
        v-if="$adminMode"
        size="sm"
        variant="primary"
        @click="checkHits"
      >
        <i class="fa fa-sync-alt"></i>
        Refresh
      </b-button>
    </div>
    <template v-if="pro || hitIndex < NON_PRO_MAX_SUBS_SEARCH_HITS">
      <div v-if="reels && currentHit" class="video-title">
        <b>VIDEO SOURCE:</b> <span>{{ currentHit.video.title }}</span>
      </div>
      <LazyYouTubeWithTranscript
        v-if="currentHit"
        :ref="`youtube-${hitIndex}`"
        class="main-dark"
        v-bind="{
          video: currentHit.video,
          showAnimation: !reels,
          initialLayout: 'vertical',
          startLineIndex: Math.max(startLineIndex, 0),
          speed,
          show: currentHit.show,
          showType: currentHit.showType,
          showFullscreenToggle: true,
          autoload: true,
          autoplay: navigated,
          showLineList: false,
          showInfo: true,
          episodes: hits.map((h) => h.video),
          forcePro: true,
        }"
        @previous="goToPrevHit"
        @next="goToNextHit"
      />
    </template>
    <template v-if="!pro">
      <YouNeedPro
        v-if="hitIndex > NON_PRO_MAX_SUBS_SEARCH_HITS - 1"
        :message="`See all ${hits.length} search results with a Pro account`"
      />
    </template>

    <b-modal
      ref="playlist-modal"
      size="lg"
      centered
      hide-footer
      title="Video Caption Search Results"
      body-class="playlist-modal-wrapper"
      @show="onPlaylistModalShown"
    >
      <div class="playlist-modal">
        <div class="pt-3 pl-3 pr-3">
          <button
            :class="{
              'btn btn-small': true,
              'bg-dark': sort === 'length',
              'text-white': sort === 'length',
            }"
            @click.stop.prevent="sort = 'length'"
          >
            Sort By Length
          </button>
          <button
            :class="{
              'btn btn-small': true,
              'bg-dark': sort === 'left',
              'text-white': sort === 'left',
            }"
            @click.stop.prevent="sort = 'left'"
          >
            Sort Left
          </button>
          <button
            :class="{
              'btn btn-small': true,
              'bg-dark': sort === 'right',
              'text-white': sort === 'right',
            }"
            @click.stop.prevent="sort = 'right'"
          >
            Sort Right
          </button>
        </div>
        <template v-for="c in get(`groupIndex${ucFirst(sort)}`)">
          <div
            :set="(theseHits = get(`groups${ucFirst(sort)}`)[c])"
            :key="`comp-subs-grouping-${sort}-${c}`"
          >
            <hr
              :key="`comp-subs-grouping-${c}-divider`"
              v-if="theseHits && theseHits.length > 0"
            />
            <template v-for="(hit, index) in theseHits">
              <div
                @click.stop="goToHit(hit)"
                :class="{
                  current: hit === currentHit,
                  'playlist-modal-item': true,
                }"
                :key="`dropdown-line-${c}-${index}`"
                :ref="
                  hit === currentHit ? 'playlist-modal-current-item' : undefined
                "
              >
                <SmallStar
                  :item="hit"
                  :saved="(hit) => hit.saved"
                  :save="saveHit"
                  :remove="removeSavedHit"
                />
                <img
                  class="hit-thumb"
                  :src="`https://img.youtube.com/vi/${hit.video.youtube_id}/hqdefault.jpg`"
                  :alt="hit.video.title"
                />
                <span
                  :key="`dropdown-line-${index}-annotate-${
                    hit.video.subs_l2[Number(hit.lineIndex)].line
                  }`"
                >
                  <span>
                    <span
                      v-if="
                        ['left', 'length'].includes(sort) && hit.lineIndex > 0
                      "
                      v-html="hit.video.subs_l2[Number(hit.lineIndex) - 1].line"
                      style="margin-right: 0.5em; opacity: 0.5"
                    ></span>
                    <span
                      v-html="
                        highlightMultiple(
                          hit.video.subs_l2[Number(hit.lineIndex)].line,
                          terms.map((term) => term),
                          level
                        )
                      "
                    ></span>
                    <span
                      v-if="
                        sort === 'right' &&
                        hit.lineIndex < hit.video.subs_l2.length - 1
                      "
                      v-html="hit.video.subs_l2[Number(hit.lineIndex) + 1].line"
                      style="margin-left: 0.5em; opacity: 0.5"
                    ></span>
                  </span>
                </span>
              </div>
            </template>
          </div>
        </template>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Helper from "@/lib/helper";
import { NON_PRO_MAX_SUBS_SEARCH_HITS, POPULAR_LANGS } from "@/lib/config";
import { mapState } from "vuex";

export default {
  props: {
    terms: {
      type: Array,
    },
    level: {
      type: String,
    },
    keyboard: {
      default: true,
    },
    fullscreenToggle: {
      default: true,
    },
    tvShow: {
      default: undefined,
    },
    exact: {
      default: false,
    },
    skin: {
      default: "light",
    },
  },
  data() {
    return {
      paused: true,
      currentHit: undefined,
      groupsRight: {},
      groupsLeft: {},
      foundHits: [],
      groupsLength: {},
      excludeTerms: [],
      navigated: false,
      checking: true,
      videos: [],
      contextLeft: [],
      contextRight: [],
      groupIndexLeft: [],
      groupIndexRight: [],
      groupIndexLength: [],
      fullscreen: false,
      showFilter: false,
      regex: undefined,
      reels: false,
      excludeArr: [],
      speed: 1,
      slideIndex: 0,
      sort: "length",
      tvShowFilter: this.tvShow ? [this.tvShow.id] : "all",
      talkFilter: "all",
      NON_PRO_MAX_SUBS_SEARCH_HITS,
      youglishLang: {
        zh: "chinese",
        en: "english",
        ar: "arabic",
        nl: "dutch",
        fr: "french",
        de: "german",
        he: "hebrew",
        it: "italian",
        ja: "japanese",
        ko: "korean",
        pl: "polish",
        pt: "portuguese",
        ru: "russian",
        es: "spanish",
        tr: "turkish",
      },
    };
  },
  computed: {
    ...mapState("settings", ["l2Settings"]),
    l2SettingsOfL2() {
      let l2SettingsOfL2 = {};
      if (this.l2Settings && this.l2Settings[this.$l2.code])
        l2SettingsOfL2 = this.l2Settings[this.$l2.code];
      return l2SettingsOfL2;
    },
    pro() {
      return [1, 4].includes(Number(this.$auth.user?.role)) ? true : false;
    },
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    $dictionary() {
      return this.$getDictionary();
    },
    $dictionaryName() {
      return this.$store.state.settings.dictionaryName;
    },
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    hitIndex() {
      let hits = this.hits;
      return hits.findIndex((hit) => hit === this.currentHit);
    },
    hits() {
      let hits = [];
      for (let index of this[`groupIndex${Helper.ucFirst(this.sort)}`]) {
        for (let hit of this[`groups${Helper.ucFirst(this.sort)}`][index]) {
          hits.push(hit);
        }
      }
      return hits;
    },
    prevHit() {
      if (this.hitIndex > 0) return this.hits[this.hitIndex - 1];
      else return this.hits[this.hits.length - 1];
    },
    nextHit() {
      if (this.hitIndex < this.hits.length - 1)
        return this.hits[this.hitIndex + 1];
      else return this.hits[0];
    },
    startLineIndex() {
      let startLineIndex = this.currentHit.lineIndex;
      return startLineIndex;
    },
  },
  watch: {
    regex() {
      if (!this.unfilteredHits) this.unfilteredHits = this.hits;
      let r =
        this.regex.startsWith("!") || this.regex.startsWith("！")
          ? `^((?!${this.regex.substr(1).replace(/[,，]/gi, "|")}).)*$`
          : this.regex;
      let hits = [];
      for (let hit of this.unfilteredHits) {
        let regex = new RegExp(r, "gim");
        if (regex.test(hit.video.subs_l2[hit.lineIndex].line)) {
          hits.push(hit);
        }
      }
      this.collectContext(hits);
      this.$emit("updated", hits);
    },
  },
  async mounted() {
    if (typeof this.$store.state.settings !== "undefined") {
      this.loadSettings();
    }
    this.unsubscribeSettings = this.$store.subscribe((mutation, state) => {
      if (mutation.type === "settings/LOAD_SETTINGS") {
        this.loadSettings();
      }
    });
    this.checkHits();
  },
  activated() {
    setTimeout(() => {
      if (this.$refs[`youtube-${this.hitIndex}`])
        this.$refs[`youtube-${this.hitIndex}`].pause();
    }, 800);
  },
  beforeDestroy() {
    this.unsubscribeSettings();
  },
  destroyed() {
    if (this.keyboard) this.unbindKeys();
  },
  unmounted() {
    if (this.keyboard) this.unbindKeys();
  },
  deactivated() {
    if (this.keyboard) this.unbindKeys();
  },
  updated() {
    if (this.keyboard) this.unbindKeys();
    if (this.keyboard) this.bindKeys();
  },
  methods: {
    async onVideoUnavailable(youtube_id) {
      let video = this.currentHit.video;
      if (youtube_id && youtube_id !== video.youtube_id) return; // Always make sure the unavailable video is indeed what the user is looking at
      // Go to next video
      await Helper.timeout(2000);
      if (this.currentHit.video.youtube_id === youtube_id)
        this.removeCurrentHitAndGoToNext();
    },
    loadSettings() {
      this.tvShowFilter = this.tvShow
        ? [this.tvShow.id]
        : this.l2SettingsOfL2.tvShowFilter;
      this.talkFilter = this.l2SettingsOfL2.talkFilter;
    },
    showPlaylistModal() {
      this.$refs["playlist-modal"].show();
      // let element = document.querySelector('.playlist-modal-item.current')
      // console.log(element)
      // if (element) element.scrollIntoView()
    },
    async onPlaylistModalShown() {
      await Helper.timeout(500);
      if (this.$refs["playlist-modal-current-item"]) {
        let ref = this.$refs["playlist-modal-current-item"][0];
        ref.scrollIntoView({ block: "center" });
      }
    },
    hitIndexFromSlideIndex(slideIndex) {
      let currentSlideIndex = this.slideIndex;
      let s;
      let i = this.hitIndex;
      if (currentSlideIndex === 0) s = [i, i + 1, i - 1];
      else if (currentSlideIndex === 1) s = [i - 1, i, i + 1];
      else if (currentSlideIndex === 2) s = [i + 1, i - 1, i];
      let hitIndex = s[slideIndex];
      if (hitIndex > this.hits.length - 1) hitIndex = 0;
      if (hitIndex < 0) hitIndex = this.hits.length - 1;
      return hitIndex;
    },
    vueSlickCarouselAfterChange(slideIndex) {
      this.goToHitIndex(this.hitIndexFromSlideIndex(slideIndex));
      this.slideIndex = slideIndex;
    },
    removeCurrentHitAndGoToNext() {
      let hits = [];
      let index = this.hitIndex;
      let id = this.currentHit.video.id;
      for (let hit of this.hits) {
        if (hit !== this.currentHit && hit.video.id !== id) {
          hits.push(hit);
        }
      }
      this.collectContext(hits);
      this.$emit("updated", hits);
      this.goToHitIndex(index);
    },
    updatePaused(paused) {
      if (paused !== this.paused) {
        this.paused = paused;
      }
    },
    simplifyExcludeTerms(excludeTerms) {
      excludeTerms = excludeTerms.map((t) =>
        t
          .replace(new RegExp(`.*?((${this.terms.join("|")}).).*`), "$1")
          .replace(new RegExp(`.*?(.(${this.terms.join("|")})).*`), "$1")
          .trim()
      );
      return excludeTerms;
    },
    calculateLimit() {
      // No limit unless set
      if (!this.$store.state.settings.subsSearchLimit) return false;
      else {
        if (this.exact) {
          // Exact search while limit is set
          let l2HasScriptLearningFeature = ["hy", "ka", "ko"].includes(
            this.$l2.code
          );
          if (l2HasScriptLearningFeature) {
            return this.terms[0].length < 5
              ? this.terms[0].length < 4
                ? this.terms[0].length < 3
                  ? 100
                  : 80
                : 70
              : 60;
          } else return 50;
        } else {
          return 25;
        }
      }
    },
    async checkHits() {
      this.checking = true;
      let excludeTerms = [];
      let dictionary = await this.$getDictionary();
      if (dictionary && this.terms.length > 0) {
        for (let term of this.terms) {
          let t = await dictionary.getWordsThatContain(term);
          t = this.simplifyExcludeTerms(t);
          excludeTerms = excludeTerms.concat(t);
        }
        excludeTerms = Helper.unique(excludeTerms);
      }
      this.excludeTerms = excludeTerms.filter(
        (s) =>
          s !== "" &&
          !this.terms.filter(t => t).map((t) => t.toLowerCase()).includes(s.toLowerCase())
      );
      let hits = await this.$subs.searchSubs({
        terms: this.terms,
        excludeTerms: this.excludeTerms,
        langId: this.$l2.id,
        adminMode: false,
        continua: this.$l2.continua,
        limit: this.calculateLimit(),
        tvShowFilter: this.tvShowFilter,
        talkFilter: this.talkFilter,
        exact: this.exact,
        apostrophe: true,
        convertToSimplified: this.$l2.han,
      });

      hits = this.updateSaved(hits);
      hits = this.setShows(hits)
      this.collectContext(hits);
      this.$emit("loaded", hits);
      this.checking = false;
    },
    setShows(hits) {
      for (let hit of hits) {
        let show, showType
        if (hit.video) {
          if (hit.video.tv_show) {
            show = this.$store.getters["shows/tvShow"]({
              id: Number(hit.video.tv_show),
              l2: this.$l2,
            });
            showType = "tv_show";
          } else if (hit.video.talk) {
            show = this.$store.getters["shows/talk"]({
              id: hit.video.talk,
              l2: this.$l2,
            });
            showType = "talk";
          }
          hit.show = show
          hit.showType = showType
        }
      }
      return hits
    },
    get(name) {
      return this[name];
    },
    ucFirst() {
      return Helper.ucFirst(...arguments);
    },
    highlightMultiple(a, b, c) {
      return Helper.highlightMultiple(a, b, c);
    },
    iOS() {
      return Helper.iOS();
    },
    collectContext(hits) {
      let contextLeft = [];
      let contextRight = [];
      for (let hit of hits) {
        contextLeft.push(hit.leftContext);
        contextRight.push(hit.rightContext);
      }
      this.contextLeft = Helper.unique(contextLeft).sort((a, b) =>
        a.localeCompare(b, this.$l2.locales[0])
      );
      this.contextRight = Helper.unique(contextRight).sort((a, b) =>
        a.localeCompare(b, this.$l2.locales[0])
      );
      this.groupsLeft = this.groupContext(this.contextLeft, hits, "left");
      this.groupsRight = this.groupContext(this.contextRight, hits, "right");
      this.groupsLength = this.groupByLength(hits);
      this.groupIndexLeft = this.sortGroupIndex(this.groupsLeft);
      this.groupIndexRight = this.sortGroupIndex(this.groupsRight);
      this.groupIndexLength = this.sortGroupIndex(this.groupsLength, false);
      this.Length = this.sortGroupIndex(this.groupsRight);
      this.currentHit = this.hits[0];
    },
    groupByLength(hits) {
      let hitGroups = {};
      let savedHits = [];
      let unsavedHits = hits.filter((hit) => {
        if (hit.saved) savedHits.push(hit);
        return !hit.saved;
      });
      let lengths = hits.map(
        (hit) => hit.video.subs_l2[hit.lineIndex].line.length
      );
      lengths = Helper.unique(lengths);
      for (let length of lengths) {
        if (!hitGroups[length]) hitGroups[length] = {};
        hitGroups[length] = unsavedHits.filter(
          (hit) => hit.video.subs_l2[hit.lineIndex].line.length === length
        );
      }
      hitGroups = Object.assign({ zthSaved: savedHits }, hitGroups);
      for (let key in hitGroups) {
        hitGroups[key] = hitGroups[key].sort(
          (a, b) => a.leftContext.length - b.leftContext.length
        );
      }
      return hitGroups;
    },
    groupContext(context, hits, leftOrRight) {
      let hitGroups = {};
      let savedHits = [];
      let unsavedHits = hits.filter((hit) => {
        if (hit.saved) savedHits.push(hit);
        return !hit.saved;
      });
      for (let c of context.map((s) => s.charAt(0))) {
        if (!hitGroups[c.charAt(0)]) hitGroups[c.charAt(0)] = {};
        hitGroups[c.charAt(0)] = unsavedHits.filter((hit) =>
          c.length > 0
            ? hit[`${leftOrRight}Context`].startsWith(c)
            : hit[`${leftOrRight}Context`] === ""
        );
      }
      hitGroups = Object.assign({ zthSaved: savedHits }, hitGroups);
      for (let key in hitGroups) {
        hitGroups[key] = hitGroups[key].sort((a, b) =>
          a.leftContext.localeCompare(
            b[`${leftOrRight}Context`],
            this.$l2.locales[0]
          )
        );
      }
      return hitGroups;
    },
    sortGroupIndex(group, sort = true) {
      let index = [];
      for (let c in group) {
        index.push({ c, length: group[c].length });
      }
      if (sort) index = index.sort((a, b) => b.length - a.length);
      index = index.map((i) => i.c);
      index.splice(index.indexOf("zthSaved"), 1);
      return ["zthSaved"].concat(index);
    },
    updateSaved(hits) {
      for (let hit of hits) {
        hit.saved = this.$store.getters["savedHits/has"]({
          l2: this.$l2.code,
          hit,
          terms: this.terms,
        });
      }
      return hits;
    },
    saveHit(hit) {
      console.log("Saving subs-search hit", hit);
      this.$store.dispatch("savedHits/add", {
        terms: this.terms,
        hit: hit,
        l2: this.$l2.code,
      });
      hit.saved = true;
      if (this.currentHit === hit) this.goToNextHit();
      this.groupsLeft["zthSaved"].push(hit);
      this.groupsRight["zthSaved"].push(hit);
      this.findAndRemoveHit(this.groupsLeft, hit);
      this.findAndRemoveHit(this.groupsRight, hit);
    },
    removeSavedHit(hit) {
      console.log("Removing subs-search hit", hit);
      this.$store.dispatch("savedHits/remove", {
        terms: this.terms,
        hit: hit,
        l2: this.$l2.code,
      });
      hit.saved = false;
      if (this.currentHit === hit) this.goToNextHit();
      let index = this.groupsLeft["zthSaved"].findIndex((h) => h === hit);
      if (index !== -1) this.groupsLeft["zthSaved"].splice(index, 1);
      index = this.groupsRight["zthSaved"].findIndex((h) => h === hit);
      if (index !== -1) this.groupsRight["zthSaved"].splice(index, 1);
      this.putHitBack(this.groupsLeft, hit, "left");
      this.putHitBack(this.groupsRight, hit, "right");
    },
    findAndRemoveHit(groups, hit) {
      for (let c in groups) {
        if (c !== "zthSaved") {
          let group = groups[c];
          let index = group.findIndex((h) => h === hit);
          if (index !== -1) group.splice(index, 1);
        }
      }
    },
    putHitBack(groups, hit, leftOrRight) {
      for (let c in groups) {
        if (hit[`${leftOrRight}Context`].startsWith(c)) {
          groups[c].push(hit);
          break;
        }
      }
    },
    toggleSpeed() {
      this.speed = this.speed === 1 ? 0.75 : this.speed === 0.75 ? 0.5 : 1;
    },
    goToPreviousLine() {
      if (this.$refs[`youtube-${this.hitIndex}`])
        this.$refs[`youtube-${this.hitIndex}`].goToPreviousLine();
    },
    goToNextLine() {
      if (this.$refs[`youtube-${this.hitIndex}`])
        this.$refs[`youtube-${this.hitIndex}`].goToNextLine();
    },
    rewind() {
      if (this.$refs[`youtube-${this.hitIndex}`])
        this.$refs[`youtube-${this.hitIndex}`].rewind();
    },
    goToPrevHit() {
      this.currentHit = this.prevHit;
      this.navigated = true;
    },
    goToNextHit() {
      this.currentHit = this.nextHit;
      this.navigated = true;
    },
    goToHit(hit) {
      this.currentHit = hit;
      this.navigated = true;
      this.$refs["playlist-modal"].hide();
      setTimeout(() => {
        document.activeElement.blur();
      }, 100);
    },
    goToHitIndex(index) {
      index = Math.min(index, this.hits.length - 1);
      index = Math.max(index, 0);
      this.currentHit = this.hits[index];
      this.navigated = true;
    },
    seekYouTube(starttime) {
      let youtube = this.$refs[`youtube-${this.hitIndex}`];
      if (youtube) this.$refs[`youtube-${this.hitIndex}`].seek(starttime);
    },
    pauseYouTube() {
      let youtube = this.$refs[`youtube-${this.hitIndex}`];
      if (youtube) this.$refs[`youtube-${this.hitIndex}`].pause();
    },
    playYouTube() {
      let youtube = this.$refs[`youtube-${this.hitIndex}`];
      if (youtube) this.$refs[`youtube-${this.hitIndex}`].play();
    },
    togglePaused() {
      let youtube = this.$refs[`youtube-${this.hitIndex}`];
      if (youtube) this.$refs[`youtube-${this.hitIndex}`].togglePaused();
    },
    toggleFullscreen() {
      if (this.hits.length > 0) this.fullscreen = !this.fullscreen;
    },
    bindKeys() {
      document.addEventListener("keydown", this.keydown);
    },
    unbindKeys() {
      document.removeEventListener("keydown", this.keydown);
    },
    keydown(e) {
      if (
        !["INPUT", "TEXTAREA"].includes(e.target.tagName.toUpperCase()) &&
        !e.metaKey &&
        !e.repeat &&
        !e.target.getAttribute("contenteditable") &&
        this.$refs[`youtube-${this.hitIndex}`]
      ) {
        if (e.code == "ArrowLeft" && e.shiftKey) {
          this.goToPrevHit();
          e.preventDefault();
          return false;
        }
        if (e.code == "KeyM") {
          this.toggleSpeed();
          e.preventDefault();
          return false;
        }
        if (e.code == "ArrowRight" && e.shiftKey) {
          this.goToNextHit();
          e.preventDefault();
          return false;
        }
        if (e.code == "KeyD") {
          this.goToNextHit();
          e.preventDefault();
          return false;
        }
        if (e.code == "ArrowUp" || (e.code == "ArrowLeft" && !e.shiftKey)) {
          this.goToPreviousLine();
          e.preventDefault();
          return false;
        }
        if (e.code == "ArrowDown" || (e.code == "ArrowRight" && !e.shiftKey)) {
          this.goToNextLine();
          e.preventDefault();
          return false;
        }
        if (e.code == "KeyR") {
          this.rewind();
          e.preventDefault();
          return false;
        }
        if (e.code == "Space") {
          this.togglePaused();
          e.preventDefault();
          return false;
        }
        if (e.code == "KeyF") {
          if (this.fullscreenToggle) this.toggleFullscreen();
          e.preventDefault();
          return false;
        }
        if (e.code == "Escape") {
          if (this.fullscreenToggle) this.fullscreen = false;
          e.preventDefault();
          return false;
        }
        if (e.code == "KeyI") {
          this.reels = !this.reels;
          e.preventDefault();
          return false;
        }
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.search-subs {
  max-width: calc(100vh - 5rem);
  margin: 0 auto;
  .search-subs-hit-index {
    margin-bottom: -0.52rem;
    overflow: hidden;
  }

  .btn {
    margin: 0;
  }

  .btn:disabled {
    opacity: 0.2;
  }

  .video-area {
    background: black;
  }

  &.fullscreen {
    position: fixed;
    left: 0;
    top: 0;
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    z-index: 99;
  }

  &.search-subs-light.fullscreen {
    background: white;
  }

  &.search-subs-dark {
    &.fullscreen {
      background: black;
    }

    .search-subs-hit-index {
      color: rgba(255, 255, 255, 0.877);
    }
  }
  :deep(.youtube-transcript-column) {
    min-height: 5rem; // Make sure the black space around the subs don't shift too much between lines
  }
}

.btn.active {
  color: #fd4f1c;
}

.show-pinyin .reels {
  :deep(.annotated) {
    line-height: 1;
  }
}

.reels {
  :deep(.video-controls) {
    display: none !important;
  }

  :deep(.youtube-transcript-column) {
    margin-top: 0.5rem;
  }

  :deep(.quick-gloss) {
    display: none;
  }

  :deep(.add-pinyin) .word-block.saved {
    text-align: center;
  }

  :deep(.youtube-with-transcript) {
    width: calc(1080px / 2);
    height: calc(1920px / 2);
    background: #010101;
    margin-left: calc((100vw - 1080px / 2) / 2);
    position: relative;
  }

  :deep(.youtube) {
    width: calc(1080px / 2 * 1.77);
    height: calc(855px / 2);
    margin-left: calc(1080px / 2 * -0.77 / 2);
  }

  :deep(.synced-transcript-single-line) .transcript-line-both {
    padding-top: 0;
    font-size: 1.7em;
    font-weight: bold;
    padding-left: 1.5rem;
    padding-right: 5.75rem;
    .transcript-line-l1 {
      font-weight: normal;
      opacity: 1;
      line-height: 1.25;
    }

    .transcript-line-l2 {
      padding-left: 0;
    }
    .transcript-line-l2-rtl {
      padding-right: 0;
    }
  }

  :deep(.annotator-buttons) {
    position: absolute;
    right: -3rem;
    padding: 0;
  }

  .video-title {
    position: absolute;
    z-index: 1;
    width: calc(540px - 9rem);
    bottom: 50rem;
    margin-left: calc((100vw - 540px) / 2 + 2.5rem);
    text-align: center;
    background: #000000cc;
    color: white;
    padding: 0.5rem;
    font-size: 0.8rem;
    border-radius: 0.25rem;
    backdrop-filter: blur(10px);
  }
}
</style>
