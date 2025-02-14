<template>
  <div>
    <div
      :class="{
        'annotate-wrapper': true,
        'annotate-with-translation': showTranslation && translationData,
      }"
      v-observe-visibility="{
        callback: visibilityChanged,
        once: true,
      }"
    >
      <div class="text-center" v-if="showLoading && !annotated">
        <beat-loader
          class="d-inline-block"
          color="#28a745"
          size="5px"
        ></beat-loader>
      </div>
      <component
        :is="tag"
        :dir="dir()"
        :class="{
          'd-none': showLoading && !annotated,
          annotated,
          'text-right': dir() === 'rtl',
          'add-pinyin': l2SettingsOfL2 && l2SettingsOfL2.showPinyin,
          phonetics,
          fullscreen: fullscreenMode,
          'with-buttons': buttons,
        }"
      >
        <div class="annotator-buttons" v-if="!empty() && buttons">
          <b-button
            class="annotator-menu-toggle"
            variant="unstyled"
            @click="showMenuModal"
          >
            <i class="fas fa-ellipsis-v"></i>
          </b-button>
        </div>
        <div :class="{ 'annotate-slot': true }" v-if="!annotated">
          <slot></slot>
        </div>
        <div v-if="textMode && annotated">
          <input
            :class="{
              'annotate-input': true,
            }"
            @select="select"
            @blur="annotateInputBlur"
            @click.stop="dummyFunction"
            :value="text"
            style="width: calc(100% - 2rem)"
          />
        </div>
        <template v-if="annotated && !textMode">
          <v-runtime-template
            v-for="(template, index) of annotatedSlots"
            :key="`annotate-template-${index}`"
            :template="template"
            class="annotate-template"
            ref="run-time-template"
          />
        </template>
      </component>
      <div v-if="matchedGrammar.length > 0" class="annotate-grammar">
        <span class="annotate-grammar-header">Grammar Notes:</span>
        <span
          v-for="row in matchedGrammar"
          @click="showGrammarModal(row)"
          class="annotate-grammar-button"
          :key="`annotate-grammar-${row.id}`"
        >
          {{ row.structure }} <i class="fa fa-chevron-right" />
        </span>
      </div>
      <div
        class="annotate-translation"
        v-if="showTranslation && (translationLoading || translationData)"
      >
        <beat-loader
          class="d-inline-block"
          v-if="translationLoading"
          color="#28a745"
          size="5px"
        ></beat-loader>
        <div
          v-else
          v-html="translationHtml(translationData ? translationData : '')"
        />
      </div>
    </div>
    <b-modal
      ref="grammar-modal"
      size="xl"
      centered
      hide-footer
      title="Grammar Note"
      modal-class="safe-padding-top mt-4"
      body-class="grammar-modal-wrapper"
    >
      <LazyGrammarPoint
        v-if="grammarPointObj"
        :grammar="grammarPointObj"
        :key="`annotate-grammar-modal-${grammarPointObj.id}`"
      />
      <div class="text-center mt-3">
        <router-link
          class="btn btn-success"
          v-if="grammarPointObj"
          :to="{ name: 'grammar-view', params: { id: grammarPointObj.id } }"
        >
          Learn More
          <i class="fas fa-chevron-right ml-1" />
        </router-link>
      </div>
    </b-modal>
    <b-modal
      ref="annotate-menu-modal"
      size="sm"
      centered
      hide-footer
      title="Annotated Text"
      modal-class="safe-padding-top mt-4"
      body-class="annotate-menu-modal-wrapper"
    >
      <div class="annotate-menu-modal">
        <div class="annotate-menu-modal-item">
          <Saved
            :item="phraseItem(text, translationData)"
            store="savedPhrases"
            icon="bookmark"
            class="annotator-button focus-exclude"
            title="Save Phrase"
            ref="savePhrase"
          />
          <span @click.stop.prevent="saveAsPhraseClick">
            {{
              phraseSaved
                ? "Remove"
                : "Save as"
            }}
            Phrase
          </span>
        </div>
        <div class="annotate-menu-modal-item">
          <Speak
            :text="text"
            class="annotator-button"
            title="Speak"
            ref="speak"
          />
          <span @click="readAloud">Read Aloud</span>
        </div>

        <div class="annotate-menu-modal-item" v-if="$adminMode">
          <span
            class="annotator-button annotator-translate focus-exclude"
            title="Translate Inline"
            @click="translateClick"
            ref="translation"
          >
            <i class="fas fa-language"></i>
          </span>
          <span @click="translateClick">Show Translation</span>
        </div>
        <!-- <div class="annotate-menu-modal-item">
          <span
            class="annotator-button annotator-external-translate focus-exclude"
            title="Translate with External Translator"
            @click="externalTranslateClick"
          >
            <i class="fas fa-globe"></i>
          </span>
          <span @click="externalTranslateClick">
            Open Translator
            <small><i class="fas fa-external-link-alt"></i></small>
          </span>
        </div> -->
        <!-- <div class="annotate-menu-modal-item">
              <span
                :class="{
                  'annotator-button annotator-text-mode focus-exclude': true,
                  active: textMode,
                }"
                title="Edit"
                @click="textMode = !textMode"
              >
                <i class="fas fa-edit"></i>
              </span> Edit
            </div> -->
        <div class="annotate-menu-modal-item">
          <span
            @click="copyClick"
            title="Copy"
            class="annotator-button annotator-copy focus-exclude"
          >
            <i class="fas fa-copy"></i>
          </span>
          <span @click="copyClick">Copy</span>
        </div>
        <TranslatorLinks class="mt-2 pl-1" :text="text" />
        <hr />
        <AnnotationSettings variant="toolbar" />
      </div>
    </b-modal>
  </div>
</template>

<script>
import wordblock from "@/components/WordBlock";
import popupnote from "@/components/PopupNote";
import readerlink from "@/components/ReaderLink";
import VRuntimeTemplate from "v-runtime-template";
import Helper from "@/lib/helper";
import { breakSentences } from "@/lib/utils/string";
import { transliterate as tr } from "transliteration";
import { mapState } from "vuex";
import { getClient } from "iframe-translator";
import SmartQuotes from "smartquotes";
import BeatLoader from "vue-spinner/src/BeatLoader.vue";

export default {
  components: {
    wordblock, // Must be lower case for runtime template to work
    popupnote, // Must be lower case for runtime template to work
    readerlink, // Must be lower case for runtime template to work
    VRuntimeTemplate,
    BeatLoader,
  },
  props: {
    animationDuration: {
      default: undefined, // number of seconds to animate (highlight in sequence) each word block
    },
    emitSentenceTextAsAttr: {
      default: false,
    },
    phonetics: {
      default: true,
    },
    delay: {
      default: 123,
    },
    sticky: {
      default: false, // whether or not to show each word's level color by default (without hovering)
    },
    speak: {
      default: false,
    },
    checkSaved: {
      default: true,
    },
    popup: {
      default: true,
    },
    tag: {
      default: "span",
    },
    buttons: {
      default: false,
    },
    fullscreen: {
      default: false,
    },
    foreign: {
      default: true,
    },
    explore: {
      default: false,
    },
    showGrammar: {
      default: false,
    },
    showTranslation: {
      default: false,
    },
    showLoading: {
      default: true, // Whether to show a loading animation before annotation is complete
    },
    animationSpeed: {
      default: 1,
    },
    translation: {
      type: String,
    },
  },
  data() {
    return {
      durationPlayed: 0, // number of seconds to skip highlighting (used when a video is paused then restarts)
      annotatedSlots: [],
      annotated: false,
      annotating: false,
      translate: false,
      translationLoading: false,
      fullscreenMode: false,
      selectedText: undefined,
      batchId: 0,
      textMode: false,
      tokenized: [],
      dictionary: undefined,
      myanmarZawgyiDetector: undefined,
      myanmarZawgyiConverter: undefined,
      translationData: this.translation,
      text: undefined,
      wordblocks: [],
      matchedGrammar: [],
      grammarPointObj: undefined, // the current grammar point shown in the modal
    };
  },
  mounted() {
    let text = "";
    if (this.$slots.default) {
      for (let slot of this.$slots.default) {
        if (slot.elm) text += slot.elm.textContent + " ";
      }
    }
    text = text.replace(/[\n\s]+/g, this.$l2.continua ? "" : " ");
    this.text = text.trim(); // This cannot be a computed property because slot element is not available of the server side
    if (this.$l2.code === "my" && typeof google_myanmar_tools !== "undefined") {
      this.myanmarZawgyiDetector = new google_myanmar_tools.ZawgyiDetector();
      this.myanmarZawgyiConverter = new google_myanmar_tools.ZawgyiConverter();
    }
  },
  beforeDestroy() {
    try {
      this.tokenized = [];
      this.$refs["run-time-template"]?.[0]?.$destroy();
    } catch (err) {
      Helper.logError(err);
    }
  },
  computed: {
    ...mapState("settings", ["l2Settings"]),
    phraseSaved() {
      return this.$refs["savePhrase"] && this.$refs["savePhrase"].saved
    },
    $adminMode() {
      if (typeof this.$store.state.settings.adminMode !== "undefined")
        return this.$store.state.settings.adminMode;
    },
    l2SettingsOfL2() {
      let l2SettingsOfL2 = {};
      if (this.l2Settings && this.l2Settings[this.$l2.code])
        l2SettingsOfL2 = this.l2Settings[this.$l2.code];
      return l2SettingsOfL2;
    },
    $l1() {
      if (typeof this.$store.state.settings.l1 !== "undefined")
        return this.$store.state.settings.l1;
    },
    $l2() {
      if (typeof this.$store.state.settings.l2 !== "undefined")
        return this.$store.state.settings.l2;
    },
    $dictionaryName() {
      return this.$store.state.settings.dictionaryName;
    },
    $hanzi() {
      return this.$getHanzi();
    },
    disableAnnotation() {
      return this.l2SettingsOfL2.disableAnnotation;
    },
  },
  watch: {
    $route() {
      this.hideMenuModal();
    },
    translation() {
      this.translationData = this.translation;
    },
    async textMode() {
      if (Helper.isMobile() && this.textMode) {
        let element = this.$el.querySelector(".annotate-input");
        await Helper.timeout(30);
        element.focus();
      }
    },
  },
  methods: {
    showMenuModal() {
      this.$refs["annotate-menu-modal"].show();
    },
    hideMenuModal() {
      this.$refs["annotate-menu-modal"].hide();
    },
    showGrammarModal(grammarPointObj) {
      this.grammarPointObj = grammarPointObj;
      this.$refs["grammar-modal"].show();
    },
    hideGrammarModal() {
      this.$refs["grammar-modal"].hide();
    },
    saveAsPhraseClick() {
      let s = this.$refs["savePhrase"];
      if (!s.saved) s.save();
      else s.remove();
    },
    readAloud() {
      this.$refs["speak"].$el.click();
    },
    getSentences() {
      let sentences = [];
      for (let sentence of this.$el.querySelectorAll(
        ".annotate-template .sentence"
      )) {
        sentences.push(sentence);
      }
      return sentences;
    },
    getTranslationSentences() {
      let sentences = [];
      for (let sentence of this.$el.querySelectorAll(
        ".annotate-translation-sentence"
      )) {
        sentences.push(sentence);
      }
      return sentences;
    },
    translationHtml(text) {
      let sentences = breakSentences(text);
      let html = "";
      for (let s of sentences) {
        html += `<span class="annotate-translation-sentence">${s}</span>`;
      }
      return html;
    },
    dir() {
      return this.foreign && this.$l2?.scripts?.[0]?.direction === "rtl"
        ? "rtl"
        : "ltr";
    },
    setTranslation(translation) {
      translation = translation || "[Please try again]";
      this.translationLoading = false;
      this.translationData = translation;
      this.$emit("translationLoading", false);
      this.$emit("translation", translation);
    },
    async translateClick() {
      let text = this.text;
      let iframeTranslationClient;
      let translation;
      try {
        // https://www.npmjs.com/package/iframe-translator
        this.translationLoading = true;
        this.$emit("translationLoading", true);
        const timeout = setTimeout(() => {
          this.setTranslation(translation);
          clearTimeout(timeout);
        }, 10000);
        iframeTranslationClient = await getClient();
        translation = await iframeTranslationClient.translate(
          text,
          this.$l1.code === "zh" ? "zh-CN" : this.$l1.code
        );
        iframeTranslationClient.destroy();
        this.setTranslation(translation);
      } catch (err) {
        this.setTranslation();
        try {
          iframeTranslationClient.destroy();
        } catch (err) {
          Helper.logError(err);
        }
        Helper.logError(err);
      }
    },
    /**
     * @param {Number} startFrom Starting time in seconds
     */
    async playAnimation(startFrom = 0) {
      if (this.annotated) {
        this.animate = true;
        if (this.animationDuration) {
          let blocks = this.$el.querySelectorAll(
            ".word-block, .word-block-unknown"
          );
          let durationAlreadyPlayed = 0;
          let spans = this.$el.querySelectorAll(
            ".word-block-text, .word-block-unknown"
          );
          let aggregateText = "";
          spans.forEach(
            (span) => (aggregateText = aggregateText + span.textContent.trim())
          );
          for (let block of blocks) {
            let span = block.classList.contains("word-block")
              ? block.querySelector(".word-block-text")
              : block;
            let blockLength = span
              ? span.textContent.trim().length
              : aggregateText.length / blocks.length;
            let blockDuration =
              (blockLength / aggregateText.length) * this.animationDuration;
            if (blockDuration === 0) continue;
            durationAlreadyPlayed = durationAlreadyPlayed + blockDuration;
            // Which ones should skip
            if (durationAlreadyPlayed > startFrom) {
              if (!this.animate) return;
              block.classList.add("animate");
              await Helper.timeout(
                (blockDuration * 1000) / this.animationSpeed
              );
            }
          }
          await Helper.timeout(2000);
          blocks.forEach((b) => b.classList.remove("animate"));
        }
      }
    },
    async pauseAnimation() {
      this.animate = false;
    },
    phraseItem(phrase, translation = undefined) {
      if (typeof phrase !== "undefined") {
        let phraseItem = {
          l2: this.$l2.code,
          phrase,
          translations: {},
        };
        if (translation) phraseItem.translations[this.$l1.code] = translation;
        return phraseItem;
      }
    },
    async onMenuHide() {
      await Helper.timeout(300);
      document.activeElement.blur();
    },
    hasTranslate() {
      return this.$languages.hasGoogleTranslate(this.$l2);
    },
    dummyFunction() {
      // do nothing
    },
    select(event) {
      this.selectedText = event.target.value.substring(
        event.target.selectionStart,
        event.target.selectionEnd
      );
    },
    async externalTranslateClick() {
      let text = this.text;
      let url = this.$languages.translationURL(text, this.$l1, this.$l2);
      if (url) window.open(url, Helper.isMobile() ? "_blank" : "translate");
    },
    // https://stackoverflow.com/questions/2550951/what-regular-expression-do-i-need-to-check-for-some-non-latin-characters
    nonLatin() {
      var rforeign = /[^\u0000-\u007f]/;
      let nonLatin = rforeign.test(this.text);
      return nonLatin;
    },
    empty() {
      return !this.text || this.text.trim() === "";
    },
    fullscreenClick() {
      this.fullscreenMode = !this.fullscreenMode;
    },
    copyClick() {
      let text = this.text;
      let tempInput = document.createElement("input");
      let modal = document.querySelector('.annotate-menu-modal-wrapper')
      tempInput.style = "position: absolute; left: -1000px; top: -1000px";
      tempInput.value = text;
      modal.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      modal.removeChild(tempInput);
    },
    async visibilityChanged(isVisible) {
      if (this.delay) await Helper.timeout(this.delay);
      if (isVisible) {
        this.convertToSentencesAndAnnotate(this.$slots.default[0]);
        if (this.showGrammar) {
          this.getGrammar();
        }
      } else {
        // We unset the annotations to save memory and battery, but we set the height and width to prevent the annotated text from shifting up and down.
        // this.$el.style.minHeight = this.$el.clientHeight + "px";
        // this.$el.style.minWidth = this.$el.clientWidth + "px";
        this.annotated = false;
        this.$emit("annotated", false);
      }
    },
    async getGrammar() {
      let grammar = await this.$getGrammar();
      this.matchedGrammar = grammar.findInText(this.text);
    },
    async annotateInputBlur(e) {
      let newText = e.target.value;
      this.reannotate(newText);
      await Helper.timeout(200);
      this.selectedText = undefined;
      this.textMode = false;
      this.$emit("textChanged", newText);
    },
    reannotate(newText) {
      let node = this.$el.querySelector(".annotate-slot > *");
      node.innerText = newText;
      this.convertToSentencesRecursive(node);
      this.annotate(node);
    },
    convertToSentencesAndAnnotate(slot) {
      if (
        !this.annotating &&
        !this.annotated &&
        (this.$hasFeature("dictionary") || this.nonLatin())
      ) {
        if (slot) {
          this.convertToSentencesRecursive(slot.elm);
          if (!this.disableAnnotation) this.annotate(slot.elm);
          else this.$emit("annotated", true);
        }
      }
    },
    highlightTranslation(current) {
      let translationSentences = this.getTranslationSentences();
      for (let translationSentence of translationSentences) {
        $(translationSentence).removeClass("current");
      }
      const translationSentence = translationSentences[current];
      $(translationSentence).addClass("current");
    },
    async annotate(node) {
      this.annotated = false;
      this.annotating = true;
      this.annotatedSlots = [];
      if (typeof node !== "undefined") {
        let annotatedNode = await this.annotateRecursive(node.cloneNode(true));
        let annotatedHtml = annotatedNode.outerHTML;
        this.annotatedSlots.push(annotatedHtml);
      }
      this.annotating = false;
      this.annotated = true;
      this.onAnnotated();
    },
    onAnnotated() {
      this.$emit("annotated", true);
    },
    getSavedWords() {
      if (this.$refs["run-time-template"]?.length > 0) {
        let savedWords = [];
        for (let template of this.$refs["run-time-template"]) {
          let wordblocks = template.$children?.[0]?.$children;
          savedWords = savedWords.concat(
            wordblocks.filter((wb) => wb.saved).map((wb) => wb.saved)
          );
        }
        return savedWords;
      }
    },
    async annotateRecursive(node) {
      if (node?.classList?.contains("sentence")) {
        // .sentence node
        let sentence = node.innerText;
        // If the language is does not use apostrophes as part of the word (like Klingon)
        if (!this.$l2.apostrophe) sentence = SmartQuotes.string(sentence);
        // We MUST do that otherwise the data-sentence-text attribute (10 lines down) will mess up the markup!
        else {
          sentence = SmartQuotes.string(
            sentence.replace(/'/g, "--do-not-smart-quote-single-quotes--")
          ).replace(/--do-not-smart-quote-single-quotes--/g, "'");
        }
        if (
          this.$l2.code === "my" &&
          this.myanmarZawgyiDetector &&
          this.myanmarZawgyiConverter
        ) {
          let score = this.myanmarZawgyiDetector.getZawgyiProbability(sentence);
          if (score > 0.8)
            sentence = this.myanmarZawgyiConverter.zawgyiToUnicode(sentence);
        }
        let html = await this.tokenize(sentence, this.batchId);
        let dataSentenceText = this.emitSentenceTextAsAttr
          ? `data-sentence-text="${sentence.trim()}"`
          : "";
        let $tokenizedSentenceSpan = $(
          `<span class="sentence" @click.capture="onSentenceClick" ${dataSentenceText}>${html}</span>`
        );
        this.batchId = this.batchId + 1;
        $(node).before($tokenizedSentenceSpan);
        $(node).remove();
      } else {
        // work with child nodes
        let nodes = [];
        for (let n of node.childNodes) {
          nodes.push(n);
        }
        for (let n of nodes) {
          await this.annotateRecursive(n);
        }
      }

      return node;
    },
    tokenizationType(l2) {
      let tokenizationType = "integral";
      if (l2.continua) {
        tokenizationType = "continua";
      } else if (
        (l2.scripts && l2.scripts[0] && l2.scripts[0].script === "Arab") ||
        ["hu", "et"].includes(l2.code)
      ) {
        tokenizationType = "integral";
      } else if (["de", "gsw", "no", "en", "hy", "vi"].includes(l2.code)) {
        tokenizationType = "agglutenative";
      } else if (
        (l2.agglutinative || l2.indo) &&
        l2.wiktionary &&
        l2.wiktionary > 2000
      ) {
        tokenizationType = "agglutenative";
      }
      return tokenizationType;
    },
    async tokenize(text, batchId) {
      let html = text ? text : "";
      let tokenizationType = this.tokenizationType(this.$l2);
      // for (let code of ["en", "zh", "es", "fr", "ar", "ru", "it", "de", "hy"]) {
      //   let l2 = this.$languages.getSmart(code);
      //   console.log(l2.name, this.tokenizationType(l2));
      // }
      // console.log({ tokenizationType });
      switch (tokenizationType) {
        case "integral":
          html = await this.tokenizeIntegral(text);
          break;
        case "agglutenative":
          html = await this.tokenizeAgglutenative(text, batchId);
          break;
        case "continua":
          html = await this.tokenizeContinua(text, batchId);
          break;
        default:
        // code block
      }
      return html;
    },
    async tokenizeContinua(text, batchId) {
      let html = "";
      this.tokenized[batchId] = await (
        await this.$getDictionary()
      ).tokenize(text);
      for (let index in this.tokenized[batchId]) {
        let token = this.tokenized[batchId][index];
        if (typeof token === "object") {
          html += `<WordBlock v-bind="wordBlockTokenAttrs(${batchId},${index})">${token.text}</WordBlock>`;
        } else {
          html += token;
          // html += `<span class="word-block-unknown">${token.replace(
          //   /\s+/,
          //   "&nbsp;"
          // )}</span>`;
        }
      }
      return html;
    },
    wordBlockIntegralAttrs(p1) {
      let attrs = {
        transliterationprop: tr(p1).replace(/"/g, ""),
        ref: "word-block",
        popup: this.popup,
        phonetics: this.phonetics,
        sticky: this.sticky,
        explore: this.explore,
      };
      return attrs;
    },
    wordBlockTokenAttrs(batchId, index) {
      let token = this.tokenized[batchId][index];
      let attrs = this.wordBlockIntegralAttrs(token.text);
      if (token.candidates?.length > 0) attrs.token = token;
      return attrs;
    },
    async tokenizeAgglutenative(text, batchId) {
      let html = "";
      this.tokenized[batchId] = await (
        await this.$getDictionary()
      ).tokenize(text);
      for (let index in this.tokenized[batchId]) {
        let token = this.tokenized[batchId][index];
        if (typeof token === "object") {
          html += `<WordBlock v-bind="wordBlockTokenAttrs(${batchId},${index})">${token.text}</WordBlock>`;
        } else {
          html += `<span class="word-block-unknown">${(token || "")
            .replace(/\s+([,.!?])/, "$1")
            .replace(/\s+/g, "&nbsp;")}</span>`;
        }
      }
      return html;
    },
    async tokenizeIntegral(text) {
      let regex = `(((?![?])[${
        this.$l2.apostrophe ? "'ʼ" : ""
      }${Helper.characterClass("L")}])+)`;
      // Additional characters removed so the spanish question mark (¿) gets excluded
      // \u10000-\u1007F\u10080-\u100FF\u10140-\u1018F\u10190-\u101CF\u101D0-\u101FF\u10280-\u1029F\u102A0-\u102DF\u102E0-\u102FF\u10300-\u1032F\u10330-\u1034F\u10350-\u1037F\u10380-\u1039F\u103A0-\u103DF\u10400-\u1044F\u10450-\u1047F\u10480-\u104AF\u104B0-\u104FF\u10500-\u1052F\u10530-\u1056F\u10600-\u1077F\u10800-\u1083F\u10840-\u1085F\u10860-\u1087F\u10880-\u108AF\u108E0-\u108FF\u10900-\u1091F\u10920-\u1093F\u10980-\u1099F\u109A0-\u109FF\u10A00-\u10A5F\u10A60-\u10A7F\u10A80-\u10A9F\u10AC0-\u10AFF\u10B00-\u10B3F\u10B40-\u10B5F\u10B60-\u10B7F\u10B80-\u10BAF\u10C00-\u10C4F\u10C80-\u10CFF\u10D00-\u10D3F\u10E60-\u10E7F\u10F00-\u10F2F\u10F30-\u10F6F\u10FE0-\u10FFF\u11000-\u1107F\u11080-\u110CF\u110D0-\u110FF\u11100-\u1114F\u11150-\u1117F\u11180-\u111DF\u111E0-\u111FF\u11200-\u1124F\u11280-\u112AF\u112B0-\u112FF\u11300-\u1137F\u11400-\u1147F\u11480-\u114DF\u11580-\u115FF\u11600-\u1165F\u11660-\u1167F\u11680-\u116CF\u11700-\u1173F\u11800-\u1184F\u118A0-\u118FF\u119A0-\u119FF\u11A00-\u11A4F\u11A50-\u11AAF\u11AC0-\u11AFF\u11C00-\u11C6F\u11C70-\u11CBF\u11D00-\u11D5F\u11D60-\u11DAF\u11EE0-\u11EFF\u11FC0-\u11FFF\u12000-\u123FF\u12480-\u1254F\u13000-\u1342F\u13430-\u1343F\u14400-\u1467F\u16800-\u16A3F\u16A40-\u16A6F\u16AD0-\u16AFF\u16B00-\u16B8F\u16E40-\u16E9F\u16F00-\u16F9F\u17000-\u187FF\u18800-\u18AFF\u1B000-\u1B0FF\u1B100-\u1B12F\u1B130-\u1B16F\u1B170-\u1B2FF\u1BC00-\u1BC9F\u1D200-\u1D24F\u1D800-\u1DAAF\u1E000-\u1E02F\u1E100-\u1E14F\u1E2C0-\u1E2FF\u1E800-\u1E8DF\u1E900-\u1E95F\u1EE00-\u1EEFF\u1F200-\u1F2FF\u1F300-\u1F5FF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\u2CEB0-\u2EBEF\u2F800-\u2FA1F\uE0100-\uE01EF\uF0000-\uFFFFF\u100000-\u10FFFF
      let reg = new RegExp(regex, "gi");
      let html = text
        .replace(/\s+/gi, "!!!###!!!")
        .replace(
          reg,
          (match, p1) =>
            `<WordBlock v-bind="wordBlockIntegralAttrs('${p1.replace(
              /'/g,
              "\\'"
            )}')">${p1}</WordBlock>`
        )
        .replace(
          /!!!###!!!/gi,
          " "
          // `<span class="${
          //   this.$l2.code === "tlh" ? "klingon" : ""
          // } word-block-unknown">&nbsp;</span>`
        );
      return html;
    },
    convertToSentencesRecursive(node) {
      if (typeof node === "undefined") return node;
      if (node.nodeType === 3) {
        // textNode
        // break setnences
        let text = node.nodeValue;
        text = text.replace(/\n\u200e/g, "\n"); // Fix error when \n and a left-to-right mark are found together and mess up with the order of words.
        let sentences = breakSentences(text);
        for (let sentence of sentences) {
          // $(node).before(`<span id="sentence-placeholder-${this.batchId}">${sentence}</span>`)
          let dataSentenceText = this.emitSentenceTextAsAttr
            ? `data-sentence-text="${sentence.trim()}"`
            : "";
          let sentenceSpan = $(
            `<span class="sentence" @click.capture="onSentenceClick" ${dataSentenceText}>${sentence}</span>`
          );
          $(node).before(sentenceSpan);
        }
        $(node).remove();
      } else {
        // work with child nodes
        let nodes = [];
        for (let n of node.childNodes) {
          nodes.push(n);
        }
        for (let n of nodes) {
          this.convertToSentencesRecursive(n);
        }
      }
      return node;
    },
    onSentenceClick(e) {
      let sentenceEl = e.currentTarget;
      let sentences = this.getSentences();
      let index = sentences.findIndex((el) => el === sentenceEl);
      let current = Math.max(index, 0); // cannot set this as a data property because reactivity makes it impossible for the parent
      this.highlightTranslation(current);
      this.$emit("sentenceClick", sentenceEl);
    },
  },
};
</script>

<style lang="scss">
.annotate-translation {
  font-size: 0.8em;
  opacity: 0.7;
}

#reader-annotated p {
  margin-bottom: 0;
}

.word-block.saved {
  color: #28a745;
}

.sentence + .sentence {
  margin-left: 0.1em;
}

.l2-zh {
  .sentence {
    margin-right: 0;
  }

  .sentence + .highlight {
    margin-left: 0;
  }

  .highlight + .sentence {
    margin-left: 0;
  }

  .sentence + .sentence {
    margin-left: 0;
  }
}

.use-serif .annotate-template * {
  font-family: "Noto Serif SC", serif;
}

.annotated.fullscreen {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: white;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: auto;
  font-size: 3rem;
  padding: 3rem;
  flex-direction: row-reverse;

  .annotator-close {
    opacity: 0;
    position: absolute;
    top: 0.75rem;
    right: 2.5rem;
    transition: 0.5s all ease-in-out;
  }

  .annotator-close:hover {
    opacity: 1;
  }
}

.text-center [dir="ltr"].with-buttons .annotate-template {
  padding-left: 1rem;
}

.text-center [dir="rtl"].with-buttons .annotate-template {
  padding-right: 1rem;
}

.with-buttons {
  min-width: 61.8%;
  width: 100%;
  display: flex;
  align-items: stretch;
  flex-direction: row;

  .annotate-template {
    flex: 1;
  }

  .annotate-slot {
    flex: 1;
  }

  .annotator-buttons {
    padding: 0 0 0 0.5rem;
    order: 2;
  }
  &[dir="rtl"] {
    .annotator-buttons {
      padding: 0 0.5rem 0 0;
    }
  }
}

.annotator-menu-toggle {
  font-size: 0.8rem;
  padding: 0.1rem 0.4rem;
  border-radius: 0.2rem;
  background: none;
  border: none;
  color: #ddd;
}

.show > .annotator-menu-toggle {
  background-color: #545b62;
  color: white;
}

.main-dark,
.widget-dark {
  .annotator-menu-toggle {
    color: #ffffff55;
  }
}

.annotate-menu-modal {
  .annotate-menu-modal-item {
    padding: 0.15rem 0;
    cursor: pointer;
    &:hover {
      color: black;
    }
    .annotator-button {
      width: 2rem;
      text-align: center;
      margin-right: 0.5rem;
      display: inline-block;
    }
  }
}

.annotate-input {
  border: 1px solid #ccc;
  padding: 0.5rem 0.7rem;
  border-radius: 0.2rem;
}

.grammar-example {
  margin-top: 1rem !important;
}

.annotate-grammar {
  font-size: 0.8em;
  margin-top: 0.25rem;
  .annotate-grammar-header {
    opacity: 0.7;
  }
  .annotate-grammar-button {
    color: #28a745;
    cursor: pointer;
  }
}
</style>
