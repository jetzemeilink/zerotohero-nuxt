<router>
  {
    path: '/:l1/:l2/lesson-videos/:level?/:lesson?',
    props: true,
    meta: {
      skin: 'dark'
    }
  }
</router>
<template>
  <div class="main-dark">
    <div class="container pb-5 lesson-videos">
      <SocialHead
        v-if="lessonVideos[0]"
        :title="`HSK Lesson Expansion Videos | Language Player`"
        :description="`After finishing Lesson ${lesson} of the Chinse Zero to Hero HSK ${level} Course, reinforce the vocabulary you have learned in the lesson by watching these ${lessonVideos.length} videos:`"
        :image="`https://img.youtube.com/vi/${lessonVideos[0].youtube_id}/hqdefault.jpg`"
      />
      <client-only>
        <div class="row">
          <div class="col-md-12 text-center">
            <h3 class="mt-5">Expansion Videos</h3>
            <div class="mt-3">
              <b-dropdown
                id="dropdown-1"
                :text="levels[level].exam.name + ' ' + levels[level].level"
                class="ml-1"
              >
                <b-dropdown-item
                  v-for="(level, slug) in levels"
                  :key="`level-item-${slug}`"
                  @click="changeLevel(slug)"
                >
                  {{ level.exam.name }} {{ level.level }}
                </b-dropdown-item>
              </b-dropdown>
              <b-dropdown
                id="dropdown-1"
                :text="`Lesson ${lesson}`"
                class="ml-1"
              >
                <b-dropdown-item
                  v-for="(lesson, index) in levelLessons[level]"
                  @click="changeLesson(lesson)"
                  :key="`lesson-item-${index}`"
                >
                  Lesson {{ lesson }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <p class="mt-3 mb-5" style="max-width: 35rem; margin: 0 auto">
              After finishing Lesson {{ lesson }} of the
              <a
                :href="`https://courses.chinesezerotohero.com/p/hsk-${level}-course`"
                class="link-unstyled text-primary"
                target="_blank"
              >
                <b>Chinese Zero to Hero HSK {{ level }} Course</b>
              </a>
              , reinforce the vocabulary you have learned in the lesson by
              watching these
              {{ lessonVideos.length }} videos:
            </p>
          </div>
        </div>
        <div v-if="loading" class="text-center">
          <Loader :sticky="true" />
        </div>
        <div
          class="row mb-4"
          v-for="(video, videoIndex) in lessonVideos"
          :key="`lesson-video-${videoIndex}`"
        >
          <div class="col-md-6">
            <LazyYouTubeVideoList
              skin="dark"
              :checkSubs="false"
              :lesson="true"
              :updateVideos="updateLessonVideos"
              :videos="[video]"
              :singleColumn="true"
              :showProgress="true"
              :showPlayButton="true"
            />
          </div>
          <div class="col-md-6">
            <h5>Vocabulary covered</h5>
            <Loader
              message="Loading words...<br/>Don't wait. View the video now."
            />

            <WordList
              :words="video.matches"
              :key="`matched-words-${videoIndex}-${matchedWordsKey}`"
              skin="dark"
            ></WordList>
          </div>
        </div>

        <div class="row mt-5 mb-5">
          <div class="col-lg-2"></div>
          <div class="col-md-12 col-lg-8">
            <div class="pt-4 pb-4" v-if="unmatchedWords.length > 0">
              <h4 class="mt-3 mb-4 text-center text-danger">
                Lesson words
                <em>not</em>
                covered in the videos
              </h4>
              <Loader message="Loading words..." />

              <WordList
                :words="unmatchedWords"
                :key="`unmatched-words-${matchedWordsKey}`"
                skin="dark"
              ></WordList>
            </div>
            <div class="col-sm-12 text-center">
              <router-link
                v-if="lesson > 1"
                :class="`btn btn-${
                  skin === 'light' ? 'gray' : 'ghost-dark'
                } mr-2`"
                :to="`/${$l1.code}/${$l2.code}/lesson-videos/${level}/${
                  Number(lesson) - 1
                }`"
              >
                Previous Lesson
              </router-link>
              <router-link
                v-if="lesson < levelLessons[level]"
                :class="`btn btn-${skin === 'light' ? 'gray' : 'ghost-dark'}`"
                :to="`/${$l1.code}/${$l2.code}/lesson-videos/${level}/${
                  Number(lesson) + 1
                }`"
              >
                Next Lesson
              </router-link>
            </div>
          </div>
        </div>
      </client-only>
    </div>
    <EntryCourseAd
      v-if="words[0]"
      :entry="words[0]"
      class="focus-exclude"
      :key="`${words[0].id}-course-ad`"
      style="margin-top: 10rem"
    ></EntryCourseAd>
  </div>
</template>

<script>
import WordList from "@/components/WordList";
import Helper from "@/lib/helper";

export default {
  data() {
    return {
      loading: true,
      words: [],
      matchedWords: [],
      lessonVideos: [],
      videos: [],
      levelLessons: {
        1: 15,
        2: 15,
        3: 20,
        4: 20,
        5: 36,
        6: 40,
      },
      updateLessonVideos: 0,
      updateVideos: 0,
      matchedWordsKey: 0,
      skin: "dark",
    };
  },
  components: {
    WordList,
  },
  props: {
    level: {
      default: 1,
    },
    lesson: {
      default: 1,
    },
  },
  computed: {
    levels() {
      return Helper.languageLevels(this.$l2);
    },
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    unmatchedWords() {
      return this.words.filter((word) => {
        let noMatch = true;
        for (let video of this.lessonVideos) {
          if (video.matches && video.matches.includes(word)) noMatch = false;
        }
        return noMatch;
      });
    },
  },
  async created() {
    this.lessonVideos = [];
    let response = await this.$directus.get(
      `${this.$directus.youtubeVideosTableName(this.$l2.id)}?sort=-id&filter[l2][eq]=${
        this.$l2.id
      }&filter[level][eq]=${this.level}&filter[lesson][eq]=${this.lesson}`
    );
    let videos = response.data.data || [];
    if (videos.length > 0) {
      videos = videos.map((video) => {
        video.subs_l2 = this.$subs.parseSavedSubs(video.subs_l2);
        return video;
      });
    }
    this.loading = false;
    this.lessonVideos = Helper.uniqueByValue(videos, "youtube_id");
    let dictionary = await this.$getDictionary();
    if (dictionary) {
      let words = await dictionary.lookupByLesson(this.level, this.lesson);
      words = words.filter((word) => !word.oofc || !word.oofc === "");
      if (this.$l2.han && this.$l2.code !== "ja") {
        this.words = Helper.uniqueByValue(words, "simplified");
      } else {
        this.words = Helper.uniqueByValue(words, "head");
      }
      this.updateMatches();
    }
  },
  methods: {
    changeLevel(level) {
      this.$router.push({
        path: `/${this.$l1.code}/${this.$l2.code}/lesson-videos/${level}/1`,
      });
    },
    changeLesson(lesson) {
      this.$router.push({
        path: `/${this.$l1.code}/${this.$l2.code}/lesson-videos/${
          this.level || 1
        }/${lesson}`,
      });
    },
    updateMatches() {
      for (let video of this.lessonVideos) {
        video.matches = this.matchWords(video);
      }
      this.lessonVideos = this.lessonVideos.sort(
        (a, b) => a.text.length - b.text.length
      );
      this.matchedWordsKey++;
    },
    matchWords(video) {
      let matches = [];
      if (video.subs_l2) {
        video.text = video.subs_l2.map((line) => line.line).join("\n");
        if (this.words && this.words.length > 0) {
          for (let word of this.words) {
            if (
              video.text.includes(word.simplified) ||
              video.text.includes(word.traditional) ||
              video.text.includes(word.head)
            ) {
              matches.push(word);
            }
          }
        }
      }
      return matches;
    },
  },
};
</script>

<style lang="scss" scoped>
.youtube-video {
  max-width: 100%;
}
.zerotohero-wide {
  .lesson-videos {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}
@media (max-width: 576px) {
  .lesson-videos {
    max-width: 423px;
    margin: 0 auto;
  }
}
</style>