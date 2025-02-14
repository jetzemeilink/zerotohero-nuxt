<template>
  <div class="video-controls" v-if="video">
    <div class="video-controls-progress d-flex">
      <div class="video-controls-time mr-2 ml-2">
        {{ currentTime ? toHHMMSS(currentTime) : "--:--" }}
      </div>
      <input
        type="range"
        @change="onSeek"
        :value="currentPercentage"
        class="d-block w-100 flex-1"
      />
      <div class="video-controls-time ml-2 mr-2">
        {{ duration ? toHHMMSS(duration) : "--:--" }}
      </div>
    </div>
    <div class="video-controls-buttons">
      <!-- <button
      v-if="showLineList"
      :class="{
        'btn-video-controls   text-center': true,
        'btn-video-controls-active': showList,
      }"
      @click="showList = !showList"
    >
      <i class="fas fa-align-left"></i>
    </button> -->
      <button
        v-if="showInfoButton"
        :class="{
          'btn-video-controls text-center': true,
        }"
        @click="showInfoModal"
      >
        <i class="fa-solid fa-circle-info"></i>
      </button>
      <button
        v-if="showCollapse"
        :class="{
          'btn-video-controls btn-video-controls-collapse text-center': true,
        }"
        @click="toggleCollapsed"
        title="Hide Video (for Audiobooks)"
      >
        <i class="fas fa-caret-square-up" v-if="!collapsed"></i>
        <i class="fas fa-caret-square-down" v-if="collapsed"></i>
      </button>
      <button
        :class="{
          'btn-video-controls btn-video-controls-rewind text-center': true,
        }"
        @click="rewind"
        Title="Rewind to Beginning"
      >
        <i class="fas fa-undo"></i>
      </button>
      <button
        v-if="episodes"
        :disabled="!previousEpisode"
        class="btn-video-controls btn-video-controls-previous text-center"
        @click="$emit('previous')"
        title="Previous Video"
      >
        <i class="fas fa-step-backward"></i>
      </button>
      <button
        class="
          btn-video-controls btn-video-controls-previous-line
          text-center
        "
        @click="$emit('goToPreviousLine')"
        title="Previous Line"
      >
        <i v-if="layout === 'horizontal'" class="fas fa-arrow-up"></i>
        <i v-else class="fas fa-chevron-left"></i>
      </button>
      <button
        :class="{
          'btn-video-controls btn-video-controls-play play-pause text-center': true,
        }"
        @click="togglePaused"
        :title="paused ? 'Play' : 'Pause'"
      >
        <i v-if="paused && !speaking" class="fas fa-play"></i>
        <i v-if="!paused || speaking" class="fas fa-pause"></i>
      </button>
      <button
        class="btn-video-controls btn-video-controls-next-line text-center"
        @click="$emit('goToNextLine')"
        title="Next Line"
      >
        <i v-if="layout === 'horizontal'" class="fas fa-arrow-down"></i>
        <i v-else class="fas fa-chevron-right"></i>
      </button>
      <button
        v-if="episodes"
        :disabled="!nextEpisode"
        class="btn-video-controls btn-video-controls-next text-center"
        @click="$emit('next')"
        title="Next Video"
      >
        <i class="fas fa-step-forward"></i>
      </button>
      <!-- <button
      :class="{
        'btn-video-controls   text-center': true,
        'btn-video-controls-active': repeatMode,
      }"
      @click="toggleRepeatMode"
    >
      <i class="fas fa-sync-alt"></i>
    </button>
    <button
      :class="{
        'btn-video-controls   text-center': true,
        'btn-video-controls-active': audioMode,
      }"
      @click="toggleAudioMode"
    >
      <i class="fas fa-headphones"></i>
    </button> -->

      <button
        v-if="showFullscreenToggle"
        :class="{
          'btn-video-controls btn-video-controls-fullscreen text-center': true,
          'btn-video-controls-active': layout === 'horizontal',
        }"
        @click="toggleFullscreenMode"
        :title="layout === 'vertical' ? 'Show Transcript' : 'Hide Transcript'"
      >
        <i class="fa-solid fa-align-left"></i>
      </button>
      <button
        :class="{
          'btn-video-controls btn-video-controls-fullscreen text-center': true,
        }"
        @click="showSettingsModal"
        title="Change speed, auto-pause, and other settings"
      >
        <i class="fa-solid fa-cog"></i>
      </button>

      <div
        v-if="video && showLineList"
        :class="{ 'youtube-view-line-list': true, 'd-none': !showList }"
      >
        <b-input-group class="youtube-view-line-list-filter-wrapper">
          <b-form-input
            v-model.lazy="filterList"
            placeholder="Filter"
          ></b-form-input>
          <b-input-group-append>
            <b-input-group-text
              v-if="!filterList"
              class="btn btn-video-controls-active"
            >
              <i class="fas fa-filter"></i>
            </b-input-group-text>
            <b-input-group-text
              v-if="filterList"
              class="btn btn-video-controls-active"
              @click="filterList = ''"
            >
              <i class="fas fa-times"></i>
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
        <div
          v-for="(line, index) in sortedLines"
          :class="{
            'youtube-view-line-list-item': true,
            active: currentLine === line,
          }"
          :key="`video-line-list-${index}`"
          @click="
            goToLine(line);
            showList = !showList;
          "
        >
          {{ line.line }}
        </div>
      </div>
    </div>
    <b-modal
      ref="info-modal"
      centered
      hide-footer
      :title="video.title || 'Video Info'"
      body-class="video-info-modal-wrapper"
      size="md"
    >
      <div class="video-info-modal">
        <VideoAdmin :video="video" ref="videoAdmin1" />
        <EpisodeNav
          skin="light"
          :video="video"
          :episodes="episodes"
          :showType="showType"
          :show="show"
          :largeEpisodeCount="largeEpisodeCount"
          class="mt-3"
        />
      </div>
    </b-modal>
    <b-modal
      ref="settings-modal"
      centered
      hide-footer
      title="Settings"
      body-class="settings-modal-wrapper"
      size="md"
    >
      <div>
        <button
          :class="{
            'btn btn-unstyled text-center d-block p-0': true,
            'text-success': speed !== 1,
          }"
          @click="toggleSpeed"
          title="Change Playback Speed"
        >
          <span class="settings-icon">
            <i class="fas fa-tachometer-alt"></i>
          </span>
          <span>{{ speed }}x Speed</span>
        </button>
      </div>
      <div class="mt-1">
        <button
          :class="{
            'btn btn-unstyled text-center d-block p-0': true,
            'text-success': autoPause,
          }"
          @click="toggleAutoPause"
          title="Toggle Auto-Pause"
        >
          <span class="settings-icon"><i class="fas fa-hand"></i></span>
          <span>Auto-Pause</span>
        </button>
      </div>
      <hr />
      <AnnotationSettings variant="toolbar" />
    </b-modal>
  </div>
</template>

<script>
import { toHHMMSS } from "@/lib/date-helper";
export default {
  props: {
    video: {
      default: undefined,
    },
    duration: {
      type: Number,
    },
    paused: {
      default: true,
    },
    layout: {
      default: "horizontal",
    },
    show: {
      type: Object,
    },
    showFullscreenToggle: {
      default: true,
    },
    showLineList: {
      default: true,
    },
    showCollapse: {
      default: true,
    },
    showInfoButton: {
      // Whether to show an "i" button that toggles the video information display modal
      type: Boolean,
      default: false,
    },
    showType: {
      type: String,
    },
    episodes: {
      type: Array,
    },
    largeEpisodeCount: {
      type: Number, // Mannually set the number of episode displayed in the episode navigator
    },
    initialTime: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      showList: false,
      repeatMode: false,
      speed: 1,
      autoPause: false,
      filterList: "",
      speaking: false,
      audioMode: false,
      sortedLines: undefined,
      collapsed: false,
      currentLine: undefined,
      currentTime: this.initialTime,
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
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    episodeIndex() {
      return this.episodes.findIndex(
        (e) => e.youtube_id === this.video.youtube_id
      );
    },
    previousEpisode() {
      if (this.episodes && this.episodeIndex > -1) {
        return this.episodes[this.episodeIndex - 1];
      }
    },
    nextEpisode() {
      if (this.episodes && this.episodeIndex > -1) {
        return this.episodes[this.episodeIndex + 1];
      }
    },
    currentPercentage() {
      return this.duration ? (this.currentTime / this.duration) * 100 : 0;
    },
  },
  mounted() {
    if (this.showLineList) {
      this.sortedLines = this.getSortedLines();
    }
  },
  watch: {
    initialTime() {
      this.currentTime = this.initialTime // so that the progress bar updates at the start
    }
  },
  methods: {
    toHHMMSS(duration) {
      return toHHMMSS(duration);
    },
    onSeek(event) {
      let percentage = event.target.value;
      this.$emit("seek", percentage * 0.01);
    },
    togglePaused() {
      this.$emit("togglePaused");
    },
    showInfoModal() {
      this.$refs["info-modal"].show();
    },
    showSettingsModal() {
      this.$refs["settings-modal"].show();
    },
    toggleSpeed() {
      let speeds = [1, 0.75, 0.5];
      let index = speeds.findIndex((s) => s === this.speed);
      if (index > -1) {
        index = index + 1;
        if (index === speeds.length) index = 0;
      }
      this.speed = speeds[index];
      this.$emit("updateSpeed", this.speed);
    },
    toggleRepeatMode() {
      this.repeatMode = !this.repeatMode;
      this.$emit("updateRepeatMode", this.repeatMode);
    },
    toggleAutoPause() {
      this.autoPause = !this.autoPause;
      this.$emit("updateAutoPause", this.autoPause);
    },
    toggleAudioMode() {
      this.audioMode = !this.audioMode;
      this.$emit("updateAudioMode", this.audioMode);
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
      this.$emit("updateCollapsed", this.collapsed);
    },
    toggleFullscreenMode() {
      this.$emit("toggleFullscreenMode");
    },
    goToLine(line) {
      this.$emit("goToLine", line);
    },
    rewind() {
      this.$emit("rewind");
    },
    getSortedLines() {
      if (this.video && this.video.subs_l2) {
        console.log(
          `YouTube View: Sorting ${this.video.subs_l2.length} lines...`
        );
        let lines = this.video.subs_l2.map((line) => line);
        let sortedLines = lines.sort((a, b) =>
          a.line.localeCompare(b.line, this.$l2.locales[0])
        );
        let foldedLines = [];
        if (sortedLines.length > 0) {
          let lastSeen = sortedLines[0];
          lastSeen.count = 0;
          for (let line of sortedLines) {
            if (line.line === lastSeen.line) {
              lastSeen.count++;
            } else {
              foldedLines.push(lastSeen);
              lastSeen = line;
              lastSeen.count = 1;
            }
          }
        }
        foldedLines = foldedLines
          .sort((a, b) => a.line.length - b.line.length)
          .sort((a, b) => b.count - a.count);
        console.log(`YouTube View: Lines sorted.`);
        return foldedLines;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.youtube-with-transcript-horizontal-portrait .video-controls {
  background: black;
}

.video-controls-buttons {
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  max-width: 40rem;
  margin: 0 auto;

  .btn-video-controls {
    border: none;
    padding: 0 0.5rem;
    background: none;
    color: #ffffffcc;
    margin: 0 0.2rem;

    &:disabled {
      color: #cccccc44;
    }

    &.btn-video-controls-active {
      color: #fd4f1c;
    }

    &.play-pause {
      font-size: 2.5em;
    }
  }
}

.youtube-view-line-list {
  overflow: auto;
  border-radius: 0.3rem;
  background: white;
  color: #666;
  text-align: left;
  z-index: 10;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  position: fixed;
  top: 0;
  left: calc(50% - 9rem);
  max-width: calc(100vw - 50% + 9rem - 1rem);
  max-height: calc(100vh - 100vw * 9 / 16 - 2rem);
}

@media screen and (orientation: landscape) {
  .youtube-view-line-list {
    max-height: calc(100vh - 50vw * 9 / 16 - 2rem);
  }
}

.youtube-view-line-list .youtube-view-line-list-item {
  padding: 0.2rem 0.7rem;
}

.youtube-view-line-list-item {
  cursor: pointer;
}

.youtube-view-line-list-item.active {
  background-color: #eee;
}

.youtube-view-line-list-filter-wrapper {
  padding: 0.25rem;
  background: white;
  width: calc(100% - 0.5rem);
  position: sticky;
  top: 0;
}

.video-controls-time {
  white-space: nowrap;
  font-size: 0.8em;
}

.settings-icon {
  width: 2rem;
  text-align: center;
  display: inline-block;
}
</style>