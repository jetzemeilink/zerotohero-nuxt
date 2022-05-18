export default {
  env: {
    baseUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
  },
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Zero to Hero Languages',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      // { name: 'referrer', content: 'no-referrer'}, // Turned off because some youtube videos will not load.
      { name: 'viewport', content: 'viewport-fit=cover, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/img/icons/favicon.ico' },
      { rel: 'stylesheet', href: '/vendor/fontawesome-free-5.15.4-web/css/all.min.css' },
      { rel: 'stylesheet', href: '/fonts/fonts.css' },
    ],
    script: [
      { hid: 'russian-legacy', src: '/js/russian-legacy.js', defer: true },
      { hid: 'papaparse', src: '/vendor/papaparse/papaparse.min.js', defer: true },
      { hid: 'jquery', src: '/vendor/jquery/jquery.min.js', defer: true },
      { hid: 'axios', src: '/vendor/axios/axios.min.js', defer: true },
      { hid: 'underscore', src: '/vendor/underscore/underscore.js', defer: true },
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    'css-percentage-circle',
    'video.js/dist/video-js.css',
    '@/assets/css/zerotohero.scss',
  ],

  router: {
    middleware: [
      'language-switch',
    ]
  },

  vue: {
    config: {
      runtimeCompiler: true
    }
  },

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    ['@nuxtjs/router-extras', { /* module options */ }],
    '@nuxtjs/pwa'
  ],

  pwa: {
    icon: {
      fileName: 'icon3.png', // Renamed from icon.png in order for the pwa module to regenerate updated icons
      purpose: 'maskable', // So that the user's os will add masking/padding around the icon (rounded corner, circle, etc)
    },
    manifest: {
      name: 'Zero to Hero Education',
      short_name: 'Zero to Hero',
      description: 'Language education done right.',
      theme_color: '#343a40',
      useWebmanifestExtension: false
    },
    workbox: {
      cacheAssets: [
        '/workers/dict-worker.js',
        '/js/dialect-dict.js',
        '/js/ecdict.js',
        '/js/edict.js',
        '/js/freedict.js',
        '/js/hsk-cedict.js',
        '/js/kengdic.js',
        '/js/klingonska.js',
        '/js/openrussian.js',
        '/js/russian-legacy.js',
        '/js/wiktionary.js',
      ],
      runtimeCaching: [{
        urlPattern: 'http://server.chinesezerotohero.com/.*',
        handler: 'CacheFirst',
        options: {
          cacheName: 'dictionaries',
          expiration: {
            maxEntries: 10,
          },
        },
      }],
    }
  },

  modules: [
    'bootstrap-vue/nuxt',
    '@nuxtjs/axios',
    'nuxt-i18n',
    '@nuxtjs/google-fonts',
    ['nuxt-lazy-load', {
      defaultImage: '/img/placeholder-faded.png',
      directiveOnly: false
    }],
    '@nuxtjs/auth-next'
  ],

  auth: {
    strategies: {
      local: {
        token: {
          property: 'data.token',
          global: true,
          // required: true,
          // type: 'Bearer'
        },
        user: {
          property: 'data.user',
          // autoFetch: true
        },
        endpoints: {
          login: { url: 'https://db2.zerotohero.ca/zerotohero/auth/authenticate', method: 'post' },
          // logout: { url: '/api/auth/logout', method: 'post' },
          user: { url: 'https://db2.zerotohero.ca/zerotohero/users/me', method: 'get' }
        }
      }
    }
  },

  bootstrapVue: {
    components: ['BForm', 'BCard', 'BFormInput', 'BFormFile', 'BFormGroup', 'BFormSelect', 'BFormTextarea', 'BFormSelectOption', 'BButton', 'BProgress', 'BTable',
      'BDropdown', 'BDropdownItem', 'BFormCheckbox', 'BFormCheckboxGroup', 'BFormRadio', 'BButtonGroup', 'BInputGroup', 'BInputGroupAppend', 'BInputGroupText', 'BDropdownDivider', 'BProgressBar', 'BModal'],
    directives: ['VBModal']
  },

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~plugins/main.js',
    { src: '~/plugins/pwa-update.js', mode: 'client' }
  ],

  build: {
    extend(config, { isDev, isClient }) {
      config.resolve.alias['vue'] = 'vue/dist/vue.common'
      // Extend only webpack config for client-bundle
      if (isDev && isClient) {
        config.devtool = '#source-map'
      } else {
        config.devtool = false
      }
    }
  },
  target: 'static',
  generate: {
    routes: [
      '/',
      '/language-map',
      '/en/zh/',
      '/en/zh/online-courses',
      '/en/zh/dictionary',
      '/en/zh/grammar',
      '/en/zh/tv-shows',
      '/en/zh/reader',
      '/en/zh/all-media',
      '/en/en/',
      '/en/zh/show/tv-show/831',
      '/en/zh/explore/new-levels',
      '/en/ja/',
      '/en/zh/explore/levels',
      '/en/zh/phrasebooks',
      '/en/zh',
      '/en/zh/saved-words',
      '/en/zh/resource/list/all/all',
      '/en/zh/textbooks-workbooks',
      '/en/en/all-media',
      '/en/zh/talks',
      '/en/zh/audiobooks',
      '/en/zh/youtube/browse/all/all/0',
      '/en/zh/show/tv-show/675',
      '/en/en/show/tv-show/993',
      '/zh/en',
      '/en/de/',
      '/en/zh/explore/new-levels-graphic',
      '/en/zh/resource/list',
      '/en/es/',
      '/en/zh/library',
      '/en/fr/',
      '/en/en/dictionary',
      '/zh/en/live-tv',
      '/en/ko/',
      '/zh/en/tv-shows',
      '/en/en/tv-shows',
      '/en/ja/all-media',
      '/en/zh/updates',
      '/zh/en/all-media',
      '/zh/en/dictionary',
      '/en/yue/',
      '/zh/en/online-courses',
      '/en/zh/lesson-videos',
      '/en/ja/tv-shows',
      '/en/zh/live-tv',
      '/zh/en/reader',
      '/en/en/reader',
      '/en/zh/settings',
      '/zh/en/learning-path',
      '/en/en/learning-path',
      '/en/zh/minimal-pairs',
      '/en/zh/studysheet',
      '/zh/en/',
      '/en/zh/youtube/browse',
      '/en/ja/live-tv',
      '/en/zh/book/list',
      '/en/zh/show/talk/160',
      '/en/en/talks',
      '/zh/en/talks',
      '/en/zh/learning-path',
      '/en/zh/pricing',
      '/en/ru/',
      '/en/zh/explore/related/中國,zhōng_guó,0',
      '/zh/en/resource/list/all/all',
      '/en/ja/talks',
      '/en/zh/youtube/history',
      '/zh/en/show/tv-show/993',
      '/en/en/live-tv',
      '/en/ja/dictionary',
      '/en/zh/video-count',
      '/en/ko/all-media',
      '/en/zh/pinyin-list',
      '/en/fr/all-media',
      '/en/zh/hall-of-heroes',
      '/zh/en/resource/list',
      '/en/zh/idioms',
      '/en/zh/characters',
      '/en/ja/reader',
      '/en/en/youtube/browse/all/all/0',
      '/en/de/all-media',
      '/en/en/phrasebooks',
      '/en/ru/youtube/view/54prMaPn5Ls',
      '/zh/en/audiobooks',
      '/en/ar/',
      '/en/en/audiobooks',
      '/en/zh/explore/roots',
      '/en/zh/show/tv-show/9',
      '/zh/en/phrasebooks',
      '/en/zh/book/index',
      '/en/zh/dictionary/',
      '/en/zh/show/tv-show/142',
      '/en/zh/youtube/view/BfKhREVFLkQ',
      '/en/zh/pinyin-squared',
      '/en/zh/youtube/search',
      '/en/zh/youtube/view/gSj8SHnZb1w',
      '/discover-shows',
      '/en/ja/youtube/browse/all/all/0',
      '/en/zh/phrasebook/55',
      '/en/en/show/tv-show/994'
    ],
    fallback: true,
    crawler: true
  }
}