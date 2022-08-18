import { logError } from '@/lib/utils'

export const romanizationOffByDefault = ["ko", "bo", "dz", "th", "my", "hy", "vi"]

export const transientProperties = ['l1', 'l2', 'dictionary']

export const defaultL2Settings = {
  l1: 'en', // the L1 the user used last time when they studied this language
  showDefinition: false,
  showPinyin: true,
  useTraditional: false,
  showTranslation: true,
  useSerif: false,
  showQuiz: true,
  showByeonggi: true,
  tvShowFilter: "all", // By default we only search TV shows.
  talkFilter: "all", // By default we search all talks.
  disableAnnotation: false
}

export const getDefaultL2Settings = (l2) => {
  let l2SettingsOfL2 = defaultL2Settings
  if (
    (l2.scripts &&
      l2.scripts[0] &&
      ["Cyrl", "Latn"].includes(l2.scripts[0].script)) ||
    romanizationOffByDefault.includes(l2.code)
  ) {
    l2SettingsOfL2.showPinyin = false
  }
  return l2SettingsOfL2
}

export const state = () => {
  return {
    l1: undefined, // L1 language object
    l2: undefined, // L2 language object
    dictionary: undefined,
    dictionaryName: undefined,
    adminMode: false,
    hideWord: false, // as used in the <HideDefs> component
    hidePhonetics: false, // as used in the <HideDefs> component
    hideDefinitions: false, // as used in the <HideDefs> component
    subsSearchLimit: true,
    autoPronounce: true, // Whether or not to play the audio automatically when opening a WordBlock popup
    settingsLoaded: {},
    l2Settings: {}, // keyed by language
  };
};

/**
 * EMPTY (no data in localStorage) -> initializeSettings() -> INITIALIZED
 */

export const saveSettingsToStorage = (state) => {
  if (typeof localStorage !== "undefined") {
    let settingsToSave = {}
    for (let property in state) {
      if (!transientProperties.includes(property)) settingsToSave[property] = state[property]
    }
    console.log('saving', { settingsToSave })
    localStorage.setItem("zthSettings", JSON.stringify(settingsToSave));
  }
}

export const loadSettingsFromStorage = () => {
  let loadedSettings = {}
  if (typeof localStorage !== "undefined") {
    try {
      loadedSettings = JSON.parse(localStorage.getItem("zthSettings")) || {};
    } catch (err) {
      logError(err);
    }
  }
  return loadedSettings;
};


export const mutations = {
  // This commit cannot use localStorage because it's called from the language switch middleware
  SET_L1_L2(state, {l1, l2}) {
    state.l1 = l1;
    if (typeof l2 === "undefined") return;
    state.l2 = l2;
  },
  // This assumes that SET_L1_L2 has already been called
  LOAD_SETTINGS(state, { l1, l2 }) {
    if (typeof localStorage !== "undefined") {
      let loadedSettings = loadSettingsFromStorage();
      for (let property in loadedSettings) {
        state[property] = loadedSettings[property];
      }
    }
    if (!state.l2Settings[l2.code]) {
      state.l2Settings[l2.code] = getDefaultL2Settings(l2)
    }
    // Remember the L1 the user picked, so next time when switching L2, this L1 is used.
    if (state.l2Settings[l2.code]) state.l2Settings[l2.code].l1 = l1.code
    state.settingsLoaded[l2.code] = true;
  },
  SET_L1_L2_TO_NULL(state) {
    state.l1 = null
    state.l2 = null
  },
  SET_DICTIONARY(state, dictionary) {
    state.dictionary = dictionary;
  },
  SET_DICTIONARY_NAME(state, dictionaryName) {
    state.dictionaryName = dictionaryName;
  },
  SET_GENERAL_SETTINGS(state, generalSettings) {
    for (property in generalSettings) {
      if (!transientProperties.includes(property)) {
        state[property] = generalSettings[property]
      }
    }
    saveSettingsToStorage(state)
  },
  SET_ADMIN_MODE(state, adminMode) {
    state.adminMode = adminMode;
    saveSettingsToStorage(state)
  },
  SET_AUTO_PRONOUNCE(state, autoPronounce) {
    state.autoPronounce = autoPronounce;
    saveSettingsToStorage(state)
  },
  SET_HIDE_WORD(state, hideWord) {
    state.hideWord = hideWord;
    saveSettingsToStorage(state)
  },
  SET_HIDE_PHONETICS(state, hidePhonetics) {
    state.hidePhonetics = hidePhonetics;
    saveSettingsToStorage(state)
  },
  SET_HIDE_DEFINITIONS(state, hideDefinitions) {
    state.hideDefinitions = hideDefinitions;
    saveSettingsToStorage(state)
  },
  SET_SUBS_SEARCH_LIMIT(state, subsSearchLimit) {
    state.subsSearchLimit = subsSearchLimit;
    saveSettingsToStorage(state)
  },
  SET_L2_SETTINGS(state, l2Settings) {
    // This method might be called (by showfilter.vue) before the settings are loaded from storage
    // Make sure this does not overwrite what's in storage!
    if (!state.l2Settings[state.l2.code]) return
    state.l2Settings[state.l2.code] = Object.assign(state.l2Settings[state.l2.code], l2Settings);
    if (typeof localStorage !== "undefined") {
      let loadedSettings = loadSettingsFromStorage();
      // Edge case: localStorage does not have l2Settings key
      if (!loadedSettings.l2Settings) {
        loadedSettings.l2Settings = {}
      }
      // Edge case: localStorage does not have the current l2 initialized
      if (!loadedSettings.l2Settings[state.l2.code]) {
        loadedSettings.l2Settings[state.l2.code] = state.l2Settings[state.l2.code];
      } else {
        // Only change the value in question from the localStorage (rather than saving the entire)
        // So we don't inadvertantly overwrite existing values in localStorage
        loadedSettings.l2Settings[state.l2.code] = Object.assign(loadedSettings.l2Settings[state.l2.code], l2Settings)
      }
      saveSettingsToStorage(state)
    }
  },
  RESET_SHOW_FILTERS(state) {
    if (!state.l2Settings[state.l2.code]) return
    state.l2Settings[state.l2.code].tvShowFilter = "all"
    if (state.l2?.code && 'zh en it ko es fr ja de tr ru nl'.split(' ').includes(state.l2.code)) {
      state.l2Settings[state.l2.code].talkFilter = [] // For languages with lots of content, only include tv shows in dictionary video search by default so as to give the user a faster experience.
    } else {
      state.l2Settings[state.l2.code].talkFilter = "all"
    }
  }
};

export const getters = {
  l2Settings: state => (l2Code) => {
    let l2Settings = {}
    let loadedSettings = loadSettingsFromStorage();
    if (loadedSettings.l2Settings && loadedSettings.l2Settings[l2Code]) l2Settings = loadedSettings.l2Settings[l2Code]
    return l2Settings
  },
}

export const actions = {
  setL2Settings({ commit }, l2Settings) {
    commit("SET_L2_SETTINGS", l2Settings);
  },
  setGeneralSettings({ commit }, generalSettings) {
    commit("SET_GENERAL_SETTINGS", generalSettings)
  },
  setAdminMode({ commit }, value) {
    commit("SET_ADMIN_MODE", value);
  },
  setAutoPronounce({ commit }, value) {
    commit('SET_AUTO_PRONOUNCE', value)
  },
  setHideWord({ commit }, value) {
    commit("SET_HIDE_WORD", value);
  },
  setHidePhonetics({ commit }, value) {
    commit("SET_HIDE_PHONETICS", value);
  },
  setHideDefinitions({ commit }, value) {
    commit("SET_HIDE_DEFINITIONS", value);
  },
  setSubsSearchLimit({ commit }, value) {
    commit("SET_SUBS_SEARCH_LIMIT", value);
  },
  resetShowFilters({ commit }, value) {
    commit("RESET_SHOW_FILTERS")
  }
};
