<template>
  <div class="youtube" :key="youtube">
    <div
      :style="{
        backgroundImage:
          posterOnly || (!autoplay && !loading)
            ? `url(https://img.youtube.com/vi/${youtube}/hqdefault.jpg)`
            : 'none',
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
        'background-position': 'center',
      }"
      class="youtube-screen"
      @click="loadYouTubeiFrame()"
    >
      <div :id="youtubeIframeID" class="youtube-iframe"></div>
      <div
        class="youtube-icon"
        v-if="!posterOnly && !autoplay && !loading"
      ></div>
    </div>
  </div>
</template>

<script>
import $ from "jquery";
import Helper from "@/lib/helper";

export default {
  props: {
    youtube: {
      type: String,
    },
    starttime: {
      type: Number,
      default: 0,
    },
    stoptime: {
      type: Number,
      default: -1,
    },
    autoload: {
      default: false,
    },
    autoplay: {
      default: false,
    },
    speed: {
      type: Number,
      default: 1,
    },
    startAtRandomTime: {
      default: false,
    },
    cc: {
      type: Boolean, // Whether to show cc inside the iframe player. If true, cc is shown. If false, cc is shown only if the user turns it on.
      default: false,
    },
    fullscreen: {
      type: Boolean, // Whether to allow fullscreen playback.
      default: false,
    },
    icon: {
      type: Boolean,
      default: true,
    },
    posterOnly: {
      type: Boolean,
      default: false,
    },
    controls: {
      type: Boolean,
      default: true, // Whether or not to show controls in the iframe player
    },
    muted: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      youtubeIframeID: "youtube-" + this.youtube,
      time: 0,
      neverPlayed: true,
      player: undefined,
      currentTime: 0,
      interval: undefined,
      duration: undefined,
      loading: false,
      randomSeeked: false,
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
    paused() {
      return this.player && this.player.getPlayerState
        ? this.player.getPlayerState() !== 1
        : true;
    },
    langPref() {
      // Sometimes a language (such as Breton) are mostly subtitles in French, and
      // English subtitles are not available. In this case use the best available subtitles
      if (this.$l2) {
        let preferences = {
          br: "fr",
        };
        return preferences[this.$l2.code] || this.$l1.code;
      }
    },
    isPlaying() {
      let playing =
        this.player &&
        this.player.getPlayerState &&
        this.player.getPlayerState() === 1;
      return playing;
    },
  },
  mounted() {
    if (this.autoload && !this.posterOnly) {
      this.loadYouTubeiFrame();
    }
    this.time = this.starttime;
  },
  destroyed() {
    if (this.player) {
      this.player.destroy();
      this.player = undefined;
    }
  },
  watch: {
    speed() {
      this.setSpeed(this.speed);
    },
    youtube() {
      if (this.autoload) {
        this.loadYouTubeiFrame();
      }
      this.duration = undefined;
      this.randomSeeked = false;
    },
  },
  methods: {
    getDuration() {
      if (this.player) {
        let duration = this.player.getDuration();
        return duration;
      }
    },
    mute() {
      if (this.player && this.player.mute) this.player.mute();
    },
    unMute() {
      if (this.player) this.player.unMute();
    },
    loadYouTubeiFrame() {
      if (this.posterOnly) return;
      this.loading = true;
      let id = this.$el.querySelector(".youtube-iframe").getAttribute("id");
      this.removeYouTubeAPIVars();
      let start = parseInt(this.starttime)
      let playerVars = {
        start,
        autoplay: this.autoplay ? 1 : 0,
        cc_load_policy: this.cc ? 1 : 0,
        cc_lang_pref: this.$l1 ? this.$l1.code : 'en',
        iv_load_policy: 0,
        showinfo: 0,
        playsinline: 1,
        color: "white", // Setting this to "white" will disable modestbranding.
        controls: this.controls ? 1 : 0,
        rel: 0,
        fs: this.fullscreen,
        hl: this.$l2 ? this.$l2.code : "en", // Setting the interface language to match L2 makes it less likely for the captions to show up in the video player.
        iv_load_policy: 3,
        modestbranding: 1,
        disablekb: 1,
        id,
      };
      window.onYouTubePlayerAPIReady = () => {
        this.player = new YT.Player(id, {
          height: "390",
          width: "640",
          videoId: this.youtube,
          playerVars,
          events: {
            onStateChange: (event) => {
              const UNSTARTED = -1;
              const ENDED = 0;
              const PLAYING = 1;
              const PAUSED = 2;
              const BUFFERING = 3;
              const VIDEO_CUED = 5;
              if (this.player && this.player.getPlayerState) {
                let state = this.player.getPlayerState();
                this.player.setPlaybackRate(this.speed);
                this.$emit("paused", [UNSTARTED, PAUSED].includes(state));
                this.$emit("ended", [ENDED].includes(state));
                if (this.startAtRandomTime && !this.randomSeeked) {
                  this.randomSeeked = true;
                  let startAtRandomTime = Math.random() * this.duration * 0.8;
                  this.seek(startAtRandomTime);
                }
                if (state === PLAYING) {
                  if (window && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  if (
                    this.playerIsThisPlayerNotSomeOtherPlayer() &&
                    !this.interval
                  ) {
                    this.interval = setInterval(() => {
                      this.updateCurrentTime();
                    }, 250);
                  }
                } else {
                  clearInterval(this.interval);
                  this.interval = undefined;
                }
              }
            },
            onReady: (event) => {
              if (this.player) {
                if (!this.duration) {
                  this.duration = this.player.getDuration();
                  this.$emit("duration", this.duration);
                }
              }
              if (this.muted && this.player) this.player.mute();
              this.reportIfVideoUnavailableUponAutoload(this.youtube);
            },
          },
        });
      };
      $.getScript("https://www.youtube.com/iframe_api");
    },
    async reportIfVideoUnavailableUponAutoload(youtube_id) {
      if (!this.autoload) return;
      // playerState of -1 means video is unstarted, but if a user skips the video as soon as it is loaded the video state is still -1
      // which will trigger a 'videoUnavailable' false alarm
      if (
        this.youtube === youtube_id && // Make sure the video hasn't changed on us
        this.player &&
        this.player.getPlayerState &&
        this.player.getPlayerState() === -1
      ) {
        await Helper.timeout(1000); // So le'ts make sure we give it a second before doing anything
        if (
          this.youtube === youtube_id &&
          this.player.getPlayerState() === -1
        ) {
          console.log(
            "😭 Looks like this video is unavailable:",
            `https://www.zerotohero.ca/${this.$l1.code}/${this.$l2.code}/youtube/view/${youtube_id}`
          );
          this.$emit("videoUnavailable", youtube_id);
        }
      }
    },
    playerIsThisPlayerNotSomeOtherPlayer() {
      if (this.player && this.player.getVideoData) {
        let video_id = this.player.getVideoData().video_id;
        let playerIsThisPlayerNotSomeOtherPlayer = this.youtube === video_id;
        return playerIsThisPlayerNotSomeOtherPlayer;
      }
    },
    updateCurrentTime() {
      // This cannot be a computed property because the player is not monitored by Vue
      if (this.player && this.player.getCurrentTime) {
        let newTime = this.player.getCurrentTime();

        if (newTime !== this.currentTime) {
          this.currentTime = newTime;
          if (this.currentTime === 0 && this.neverPlayed) {
            return;
          }
          this.$emit("currentTime", this.currentTime);
        }
      }
    },
    removeYouTubeAPIVars() {
      if (window["YT"]) {
        let vars = [
          "YT",
          "YTConfig",
          "onYTReady",
          "yt",
          "ytDomDomGetNextId",
          "ytEventsEventsListeners",
          "ytEventsEventsCounter",
        ];
        vars.forEach(function (key) {
          window[key] = undefined;
        });
      }
    },
    seek(starttime) {
      if (this.player && this.player.seekTo) {
        this.player.seekTo(starttime);
      }
    },
    play() {
      if (this.player && this.player.playVideo) {
        this.player.playVideo();
      }
    },
    pause() {
      if (this.player && this.player.pauseVideo) {
        this.player.pauseVideo();
      }
    },
    setSpeed(speed) {
      if (this.player) this.player.setPlaybackRate(speed);
    },
    togglePaused() {
      if (this.player && this.player.getPlayerState) {
        this.player.getPlayerState() !== 1
          ? this.player.playVideo()
          : this.player.pauseVideo();
      } else {
        this.loadYouTubeiFrame();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.youtube {
  padding-bottom: 56.25%;
  position: relative;
  :deep(iframe),
  .youtube-screen {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  .youtube-screen {
    color: white;
    font-size: 1.3rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: black;
  }
  .youtube-icon {
    content: "";
    background: url("/img/youtube-red.svg");
    width: 100px;
    height: 100px;
    position: absolute;
  }
}
</style>
