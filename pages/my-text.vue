<router>
  {
    path: '/:l1/:l2/my-text/',
    props: true,
  }
</router>
<template>
  <div class="main pt-5 pb-5">
    <SocialHead
      :title="`My ${$l2.name} Text | Language Player`"
      :description="`Read ${$l2.name} text with phonetic annotation dictionary lookup. Save new words for review.`"
    />
    <div class="container">
      <div class="row">
        <div class="col-sm-12">
          <div v-if="loaded">
            <div v-if="savedtexts.length > 0">
              <div
                v-for="savedText in savedtexts"
                :key="savedText.id"
                class="mb-4"
              >
                <TextCard :text="savedText" @removed="onTextRemoved" />
              </div>
            </div>
            <div
              v-else
              class="text-center"
              style="
                font-size: 1.2em;
                min-height: calc(100vh - 30rem);
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <div
                v-if="!$auth.loggedIn"
                class="text-center alert-success p-3 pb-4 rounded mt-4 w-100"
              >
                <p>To create new texts, please login.</p>
                <router-link :to="{ name: 'login' }" class="btn btn-success">
                  Login
                  <i class="fas fa-chevron-right"></i>
                </router-link>
              </div>
              <div v-else>You have not created any text yet.</div>
            </div>
            <b-button
              v-if="$auth.loggedIn"
              class="new-button"
              variant="success"
              @click="newText"
            >
              <span v-if="!creating">
                <i class="fas fa-plus mr-1"></i>
                New Text
              </span>
              <span v-else>
                <i class="fas fa-sync-alt"></i>
                Creating...
              </span>
            </b-button>
          </div>
          <div class="text-center mt-5 mb-5" v-else>
            <Loader :sticky="true" message="Loading your text..." />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      loaded: false,
      creating: false
    };
  },
  mounted() {
    this.updateLoaded()
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (mutation.type === "savedText/LOAD") {
        console.log('savedText/LOAD mutation detected')
        this.updateLoaded()
      }
    });
    if (!this.loadedByL2?.[this.$l2.code]) {
      this.$store.dispatch("savedText/load", {
        l2: this.$l2,
        adminMode: this.$adminMode,
      });
    }
  },
  beforeDestroy() {
    this.unsubscribe()
  },
  computed: {
    ...mapState("savedText", ["loadedByL2"]),
    ...mapState("savedText", ["itemsByL2"]),
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    savedtexts() {
      return this.itemsByL2[this.$l2.code] || [];
    },
    hasLocalText() {
      if (typeof localStorage !== "undefined") {
        let localText = localStorage.getItem("zthReaderText");
        return localText;
      }
    },
  },
  methods: {
    updateLoaded() {
      this.loaded = this.loadedByL2?.[this.$l2.code]
    },
    onTextRemoved(id) {
      this.$store.dispatch("savedText/remove", { l2: this.$l2, itemId: id });
    },
    async newText() {
      this.creating = true
      let item = await this.$store.dispatch("savedText/add", { l2: this.$l2 });
      if (item) {
        this.$router.push({
          name: "reader",
          params: { method: "shared", arg: item.id },
        });
      }
      this.creating = false
    },
  },
};
</script>

<style lang="scss" scoped>
.new-button {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
}
.zerotohero-with-mini-player {
  .new-button {
    bottom: 6rem;
  }
}
.zerotohero-not-wide {
  .new-button {
    bottom: 6rem;
  }
}


.zerotohero-not-wide.zerotohero-with-mini-player {
  .new-button {
    bottom: 11rem;
  }
}
</style>