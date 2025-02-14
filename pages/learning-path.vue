<router>
  {
    path: '/:l1/:l2/learning-path',
    meta: {
      title: 'Learning Path | Language Player',
      metaTags: [
        {
          name: 'description',
          content: 'A visual representation of how you can achive langauge fluency, from zero to hero.'
        }
      ]
    }
  }
</router>
<template>
  <div class="main pb-5">
    <div class="container-fluid">
      <div class="row">
        <img
          :src="background(this.$l2)"
          class="img-fluid w-100"
          style="
            max-height: 8rem;
            overflow: hidden;
            object-fit: cover;
            object-position: center center;
          "
        />
      </div>
      <div class="container">
        <div class="row">
          <div class="col-sm-12 p-0">
            <LanguageFlag :language="$l2" class="flag" />
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <SocialHead
        v-if="courses && courses['A1'] && courses['A1'][0]"
        :title="`Complete Guide to Mastering the ${$l2.name} Language | Language Player`"
        :description="`Getting started in just ${
          Math.ceil(levels[0].hours / 10) * 10
        } hours. From zero to mastery in ${(($l2.hours || 1100) * 4)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} hours!`"
        :image="courses['A1'][0].thumbnail.data.full_url"
      />
      <SocialHead
        v-else
        :title="`Complete Guide to Mastering the ${$l2.name} Language | Language Player`"
        :description="`From zero to mastery in ${(($l2.hours || 1100) * 4)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} hours`"
      />

      <h3 class="mt-3">{{ $l2.name }} Learning Path</h3>
      <div class="learning-path">
        <div class="level">
          <LazyLanguageInfoBox
            :lang="$l2"
            class="mb-4"
            :showImages="false"
            :brief="true"
          />
        </div>
        <div
          v-for="(level, index) in levels"
          :key="`learning-path-level-${index}`"
          class="level"
          :data-learning-path-level="$l2.code === 'zh' ? level.hsk : level.cefr"
        >
          <h4 class="level-title">
            <router-link :to="mediaUrlByLevel(level.number)"  :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
              {{ level.category }} ({{
                $l2.code === "zh" && level.number < 7
                  ? `HSK ${level.number}`
                  : level.cefr
              }}*) level <i class="fa-solid fa-chevron-right"></i>
            </router-link>
          </h4>
          <p>
            <b :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
              <i class="fas fa-clock"></i>
              Time investment:
            </b>
            <b>{{ levelHours(level) }} hours</b>
          </p>
          <template>
            <div class="level-activity">
              <div v-if="courses[level.cefr] || hasPhrasebooks">
                <b :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
                  <i class="fa-solid fa-spell-check"></i>
                  Vocabulary &amp; Syntax:
                </b>
                {{ levelVocabularyAndSyntaxHours(level) }} hours
              </div>
              <div class="pl-3">
                <Resource
                  class="mt-3"
                  v-if="level.number < 3 && hasPhrasebooks"
                  :resource="{
                    title: `Learn most common phrases in ${$l2.name}`,
                    url: `/${$l1.code}/${$l2.code}/phrasebooks`,
                    thumbnail: '/img/banner-phrasebook.jpg',
                    description: `by watching video clips containing the most common ${$l2.name} expressions.`,
                  }"
                  :level="$l2.code === 'zh' ? level.hsk : level.cefr"
                  buttonText="Learn Phrases"
                  :internal="true"
                />
                <Resource
                  :key="`learning-path-course-${level.cefr}-${index}`"
                  class="mt-3"
                  v-for="(course, index) in courses[level.cefr]"
                  :resource="{
                    title: course.title,
                    url: course.url,
                    thumbnail: course.thumbnail.data.full_url,
                  }"
                  buttonText="Open Course"
                  :showThumbnail="false"
                />
              </div>
            </div>
          </template>
          <div class="level-activity">
            <p>
              <b :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
                <i class="fa-solid fa-headphones"></i>
                Input by Audio & Text:
              </b>
              {{ levelInputHours(level) }} hours
            </p>
            <div class="pl-3">
              <Resource
                :resource="{
                  title: `Watch videos in ${$l2.name}`,
                  url: mediaUrlByLevel(level.number),
                  thumbnail: '/img/banner-media.jpg',
                  description: `and study transcripts of ${$l2.name} videos with a popup dictionary.`,
                }"
                :level="$l2.code === 'zh' ? level.hsk : level.cefr"
                buttonText="Browse Videos"
                :internal="true"
              />
              <Resource
                class="mt-3"
                v-if="level.number > 3 && $hasFeature('dictionary')"
                :level="$l2.code === 'zh' ? level.hsk : level.cefr"
                :resource="{
                  title: `${$l2.name} reading with popup dictionary`,
                  url: `/${$l1.code}/${$l2.code}/books`,
                  thumbnail: '/img/banner-library.jpg',
                  description: `Read books and text in ${$l2.name} with the help of our popup dictionary.`,
                }"
                buttonText="Browse Books"
                :internal="true"
              />
            </div>
          </div>
          <div class="level-activity">
            <p>
              <b :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
                <i class="fa-solid fa-comment-alt"></i>
                Conversation Practice:
              </b>
              {{ levelConverstionHours(level) }} hours
            </p>
            <div class="pl-3">
              <Resource
                :resource="{
                  title: 'iTalki Lessons',
                  url: 'https://www.italki.com/affshare?ref=zerotohero',
                  thumbnail: '/img/banner-italki.jpg',
                  description:
                    'Take one-on-one online conversation practice sessions at iTalki. New sign-ups get $10 off.',
                }"
                buttonText="Open iTalki"
                :showThumbnail="false"
              />
            </div>
          </div>
          <template
            v-if="resources[level.cefr] && resources[level.cefr].length > 0"
          >
            <div class="level-activity">
              <p>
                <b :data-level="level.cefr">Resources:</b>
                At the
                {{ level.cefr }} level, we recommend using the following
                resources, products, or services:
              </p>
              <div
                v-for="(resource, index) in resources[level.cefr]"
                :key="`learning-path-resource-${level.cefr}-${index}`"
              >
                <Resource
                  :level="level.cefr"
                  :resource="{
                    title: resource.title,
                    url: resource.url,
                    thumbnail: resource.thumbnail.data.full_url,
                  }"
                  :internal="true"
                />
              </div>
            </div>
          </template>
          <template>
            <template v-for="(exam, index) in exams[level.cefr]">
              <div
                class="level-milestone mb-5"
                v-if="exam.level !== 'all' || level.number > 1"
                :key="`learning-path-exam-${level.cefr}-${index}`"
              >
                <div
                  class="level-milestone-dot"
                  :data-bg-level="$l2.code === 'zh' ? level.hsk : level.cefr"
                ></div>
                <b :data-level="$l2.code === 'zh' ? level.hsk : level.cefr">
                  <i class="fa-solid fa-trophy"></i>
                  Milestone:
                </b>
                <b>
                  Pass the
                  <a :href="exam.url" target="_blank">
                    {{ exam.title }}
                    <span v-if="exam.level === 'all'">({{ level.cefr }})</span>
                  </a>
                  exam
                </b>
              </div>
            </template>
          </template>
          <div v-if="level.number === '7'">
            <h4 class="mb-4">
              <b :data-level="level.cefr">Total time from zero to mastery:</b>
              <b>
                {{
                  (($l2.hours || 1100) * 4)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }}
                hours
              </b>
            </h4>
            <span v-if="$l2.code === 'zh'">
              * HSK stands for
              <Annotate>
                <span>
                  <a
                    href="http://www.chinesetest.cn/gosign.do?id=1&lid=0#"
                    target="_blank"
                  >
                    汉语水平考试
                  </a>
                </span>
              </Annotate>
              (Chinese Proficiency Test). HSK 1, 2, 3 ... 6 refer to the levels
              of the test, level 6 being the highest.
            </span>
            <span>
              * A1, A2, B1 ... C2 refer to language proficiency levels according
              to the
              <a
                href="https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages"
                target="_blank"
              >
                Common European Framework of Reference for Languages (CEFR)
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Resource from "@/components/Resource";
import { background, backgroundKeyword } from "@/lib/utils/background";
import Helper from "@/lib/helper";
import { LEVELS, LANGS_WITH_LEVELS } from "@/lib/utils";

export default {
  components: {
    Resource,
  },
  data() {
    return {
      exams: {},
      courses: {},
      resources: {},
      LANGS_WITH_LEVELS,
      hasPhrasebooks: false,
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
    levels() {
      let levels = Object.keys(LEVELS).map((key) => {
        return { number: key, ...LEVELS[key] };
      });
      let hours = Helper.languageHours(this.$l2);
      for (let level in levels) {
        level = Number(level);
        levels[level].hours = hours[level + 1];
      }
      return levels;
    },
    omniglot() {
      let url = "https://www.omniglot.com/writing/" + this.$l2.omniglot;
      url = url.replace(/[^/]+\/\.\./, "");
      return {
        title: `Basic information, useful phrases`,
        url,
        thumbnail: "/img/banner-omniglot.jpg",
      };
    },
  },
  async created() {
    this.exams = await this.loadExams();
    this.courses = await this.loadCourses();
    this.resources = await this.loadResources();
    this.checkPhrasebooks();
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type.startsWith("phrasebooks")) {
        this.checkPhrasebooks();
      }
    })
  },
  methods: {
    checkPhrasebooks() {
      this.hasPhrasebooks =
        this.$store.state.phrasebooks.phrasebooks &&
        this.$store.state.phrasebooks.phrasebooks[this.$l2.code] &&
        this.$store.state.phrasebooks.phrasebooks[this.$l2.code].length > 0;
    },
    mediaUrlByLevel(levelNum) {
      return LANGS_WITH_LEVELS.includes(this.$l2.code)
        ? `/${this.$l1.code}/${this.$l2.code}/youtube/browse/all/${levelNum}`
        : `/${this.$l1.code}/${this.$l2.code}/all-media`;
    },
    levelHours(level) {
      return Math.ceil(level.hours / 10) * 10;
    },
    levelVocabularyAndSyntaxHours(level) {
      let levelVocabularyAndSyntaxHours =
        Math.ceil((level.hours * 0.5) / 10) * 10;
      if (level.number >= 3) {
        levelVocabularyAndSyntaxHours =
          Math.ceil(
            (levelVocabularyAndSyntaxHours * Math.pow(0.7, level.number - 2)) /
              10
          ) * 10;
      }
      return levelVocabularyAndSyntaxHours;
    },
    levelConverstionHours(level) {
      if (level.number <= 2)
        return Math.ceil(this.levelVocabularyAndSyntaxHours(level) / 2);
      else return this.levelVocabularyAndSyntaxHours(level);
    },
    levelInputHours(level) {
      return (
        this.levelHours(level) -
        this.levelVocabularyAndSyntaxHours(level) -
        this.levelConverstionHours(level)
      );
    },
    background(l2) {
      return background(l2);
    },
    backgroundKeyword(l2) {
      return backgroundKeyword(l2);
    },
    async loadExams() {
      let response = await this.$directus.get(
        `items/exams?filter[l2][eq]=${this.$l2.id}`
      );
      response = response.data;
      let exams = response.data || [];
      let result = {};
      for (let exam of exams) {
        for (let level of this.levels) {
          if (exam.level && ["all", level.number].includes(exam.level)) {
            result[level.cefr] = result[level.cefr] || [];
            result[level.cefr].push(exam);
          }
        }
      }
      return result;
    },
    async loadCourses() {
      let response = await this.$directus.get(
        `items/resources?filter[l2][eq]=${this.$l2.id}&filter[type][eq]=courses&filter[featured][eq]=1&fields=*,thumbnail.*`
      );
      if (response.data?.data) {
        let courses = response.data.data || [];
        let result = {};
        for (let course of courses) {
          for (let level of this.levels) {
            if (course.level && course.level.includes(level.number)) {
              result[level.cefr] = result[level.cefr] || [];
              result[level.cefr].push(course);
            }
          }
        }
        return result;
      }
    },
    async loadResources() {
      let response = await this.$directus.get(
        `items/resources?filter[l2][eq]=${this.$l2.id}&filter[type][neq]=courses&filter[featured][eq]=1&fields=*,thumbnail.*`
      );
      response = response.data;
      let result = {};
      let resources = response.data || [];
      for (let resource of resources) {
        for (let level of this.levels) {
          if (resource.level && resource.level.includes(level.number)) {
            result[level.cefr] = result[level.cefr] || [];
            result[level.cefr].push(resource);
          }
        }
      }
      return result;
    },
  },
};
</script>

<style lang="scss" scoped>
.learning-path {
  .level {
    padding-bottom: 1.5rem;
    padding-left: 1.5rem;
    border-left: 0.5rem solid #ccc;
    position: relative;

    &::before {
      content: "";
      background: white;
      display: block;
      position: absolute;
      left: -1.25rem;
      top: 0;
      border-radius: 100%;
      height: 2rem;
      width: 2rem;
      border: 0.5rem solid #ccc;
    }

    &[data-learning-path-level="PreA1"] {
      border-left-color: #b51700;
      &::before {
        border-color: #b51700;
      }
    }

    &[data-learning-path-level="A1"] {
      border-left-color: #0076ba;
      &::before {
        border-color: #0076ba;
      }
    }

    &[data-learning-path-level="A2"] {
      border-left-color: #00882b;
      &::before {
        border-color: #00882b;
      }
    }

    &[data-learning-path-level="B1"] {
      border-left-color: #6a348a;
      &::before {
        border-color: #6a348a;
      }
    }

    &[data-learning-path-level="B2"] {
      border-left-color: #5b0516;
      &::before {
        border-color: #5b0516;
      }
    }

    &[data-learning-path-level="C1"] {
      border-left-color: #011b3c;
      &::before {
        border-color: #011b3c;
      }
    }

    &[data-learning-path-level="C2"],
    &[data-learning-path-level="7-9"] {
      border-left-color: #0f575c;
      &::before {
        border-color: #0f575c;
      }
      &::after {
        content: "";
        border-top: 2rem solid #0f575c;
        border-left: 1rem solid transparent;
        border-right: 1rem solid transparent;
        display: block;
        position: absolute;
        left: -1.25rem;
        bottom: -2rem;
        height: 0;
        width: 0;
      }
    }

    &[data-learning-path-level="1"] {
      border-left-color: #f8b51e;
      &::before {
        border-color: #f8b51e;
      }
    }

    &[data-learning-path-level="2"] {
      border-left-color: #267f94;
      &::before {
        border-color: #267f94;
      }
    }

    &[data-learning-path-level="3"] {
      border-left-color: #fd4f1c;
      &::before {
        border-color: #fd4f1c;
      }
    }

    &[data-learning-path-level="4"] {
      border-left-color: #bb1718;
      &::before {
        border-color: #bb1718;
      }
    }

    &[data-learning-path-level="5"] {
      border-left-color: #1b3e76;
      &::before {
        border-color: #1b3e76;
      }
    }

    &[data-learning-path-level="6"] {
      border-left-color: #6a3669;
      &::before {
        border-color: #6a3669;
      }
    }

    .level-title {
      margin-bottom: 1rem;
    }

    .level-activity {
      margin-top: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .level-milestone {
      position: relative;
      .level-milestone-dot {
        display: block;
        position: absolute;
        left: -2.35rem;
        top: 0;
        border-radius: 100%;
        height: 1.25rem;
        width: 1.25rem;
      }
    }
  }
}

:deep(.flag) {
  top: -1rem;
  left: 0;
  position: relative;
  transform: scale(2.5) translateX(0.5rem);
  img {
    border: 2px solid white;
  }
}
</style>