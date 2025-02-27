importScripts('../vendor/javascript-lemmatizer/js/lemmatizer.js')
importScripts("../vendor/localforage/localforage.js")

const Dictionary = {
  name: 'ecdict',
  lang: undefined,
  file: undefined,
  frequencyFile: undefined,
  frequencyAdded: false,
  words: [],
  frequency: [],
  index: {},
  tokenizationCache: {},
  tables: [],
  levels: {
    1: 'Pre-A1',
    2: 'A1',
    3: 'A2',
    4: 'B1',
    5: 'B2',
    6: 'C1',
    7: 'C2'
  },
  async load(lang) {
    console.log('Loading ECDICT...')
    this.lang = lang
    const server = 'https://server.chinesezerotohero.com/'
    this.file = `${server}data/ecdict/ecdict-longer-ranked.csv.txt`
    this.touchstoneFile = `${server}data/ecdict/touchstone.csv.txt`
    this.frequencyFile = `${server}data/ecdict/frequency.csv.txt`
    await this.loadWords()
    // await this.loadFrequency() // Frequency is now built in the csv
    this.addIdToWords()
    // this.addFrequencyToWords()
    // this.addFrequencyToPhrases()
    this.assignLevels()
    // console.log(Papa.unparse(this.words))
    return this
  },
  async loadSmart(name, file) {
    let data = await localforage.getItem(name)
    if (!data) {
      console.log(`ECDICT: requesting '${file}' . . .`)
      let response = await axios.get(file)
      data = response.data
      localforage.setItem(name, data)
      response = null
    } else {
      console.log(`ECDICT: dictionary '${name}' loaded from local indexedDB via localforage`)
    }
    if (data) {
      let results = Papa.parse(data, {
        header: true
      })
      return results.data
    }
  },
  async loadWords() {
    console.log('Loading words...')
    let data = await this.loadSmart('ecdict', this.file)
    let words = []
    for (let index in data) {
      let row = data[index]
      let word = row
      word = this.augment(row)
      words.push(word)
    }
    this.words = words
    console.log('Words loaded.')
  },
  splitByReg(text, reg) {
    let words = text.replace(reg, '!!!BREAKWORKD!!!$1!!!BREAKWORKD!!!').replace(/^!!!BREAKWORKD!!!/, '').replace(/!!!BREAKWORKD!!!$/, '')
    return words.split('!!!BREAKWORKD!!!')
  },
  // https://stackoverflow.com/questions/38613654/javascript-find-unique-objects-in-array-based-on-multiple-properties
  uniqueByValues(arr, keyProps) {
    const kvArray = arr.map(entry => {
      const key = keyProps.map(k => entry[k]).join('|');
      return [key, entry];
    });
    const map = new Map(kvArray);
    return Array.from(map.values());
  },
  subdict(data) {
    let newDict = Object.assign({}, this);
    return Object.assign(newDict, { words: data });
  },
  subdictFromText(text) {
    let search = text.toLowerCase();
    let subdictFilterFunction = row => {
      if (this.accentCritical) {
        return text.includes(row.head) || search.includes(row.head);
      } else {
        let headMatches = text.includes(row.head);
        let searchMatches =
          row.search.length > 0 && search.includes(row.search);
        let found = headMatches || searchMatches;
        return found;
      }
    };
    let words = this.words.filter(subdictFilterFunction);
    return this.subdict(words);
  },
  tokenize(text) {
    if (this.tokenizationCache[text]) return this.tokenizationCache[text];
    let subdict = this.subdictFromText(text);
    let tokenized = this.tokenizeRecursively(text, subdict);
    if (["tur"].includes(this.l2)) this.tokenizationCache[text] = tokenized;
    return tokenized;
  },
  tokenizeRecursively(text, subdict) {
    const longest = subdict.longest(text);
    if (longest.matches && longest.matches.length > 0) {
      for (let word of longest.matches) {
        longest.matches = this.stemWordsWithScores(word, 1).map(w => w.w).concat(longest.matches);
        // longest.matches = longest.matches.concat(this.phrasesWithScores(word, 1)) // This is very slow
      }
      let result = [];
      /*
      result = [
        '我',
        {
          text: '是'
          candidates: [{...}, {...}, {...}
        ],
        '中国人。'
      ]
      */
      for (let textFragment of text.split(longest.text)) {
        result.push(textFragment); // '我'
        result.push({
          text: longest.text,
          candidates: longest.matches
        });
      }
      result = result.filter(item => {
        if (typeof item === "string") {
          return item !== "";
        } else {
          return item.text !== "";
        }
      });
      result.pop(); // last item is always useless, remove it
      var tokens = [];
      for (let item of result) {
        if (typeof item === "string" && item !== text) {
          for (let token of this.tokenizeRecursively(item, subdict)) {
            tokens.push(token);
          }
        } else {
          tokens.push(item);
        }
      }
      return tokens;
    } else {
      return [text];
    }
  },
  tokenizeIntegral(text) {
    if (this.tokenizationCache[text]) return this.tokenizationCache[text]
    text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents e.g. résumé -> resume
    tokenized = [];
    let segs = this.splitByReg(text, /([a-zA-Z0-9]+)/gi);
    var lemmatizer = new Lemmatizer();
    let reg = new RegExp(
      `.*([a-z0-9]+).*`
    );
    for (let seg of segs) {
      let word = seg.toLowerCase();
      if (
        reg.test(word) &&
        !['m', 's', 't', 'll', 'd', 're', 'ain', 'don'].includes(word)
      ) {
        let token = {
          text: seg,
          candidates: [],
        };
        let lemmas = lemmatizer.lemmas(word);
        if (lemmas && lemmas.length === 1) token.pos = lemmas[0][1]
        lemmas = [[word, "inflected"]].concat(lemmas);
        let found = false;
        let forms = this.unique(lemmas.map(l => l[0]))

        for (let form of forms) {
          let candidates = this.lookupMultiple(form);
          if (candidates.length > 0) {
            found = true;
            token.candidates = token.candidates.concat(candidates);
          }
        }
        token.candidates = this.uniqueByValue(token.candidates, "id");
        if (found) {
          tokenized.push(token);
        } else {
          tokenized.push(seg);
        }
      } else {
        tokenized.push(seg);
      }
    }
    this.tokenizationCache[text] = tokenized
    return tokenized
  },
  unique(a) {
    return a.filter((item, i, ar) => ar.indexOf(item) === i);
  },
  getWords() {
    return this.words
  },
  getWordsThatContain(text) {
    let words = this.words.filter(w => w.head && w.head.includes(text))
    let strings = words.map((word) => word.head)
    return this.unique(strings)
  },
  uniqueByValue(array, key) {
    let flags = []
    let unique = []
    let l = array.length
    for (let i = 0; i < l; i++) {
      if (flags[array[i][key]]) continue
      flags[array[i][key]] = true
      unique.push(array[i])
    }
    return unique
  },
  async loadFrequency() {
    console.log('Loading word frequency list...')
    let res = await axios.get(this.frequencyFile)
    let results = await Papa.parse(res.data, {
      header: true
    })
    this.frequency = results.data.map(row => row.word)
  },
  getSize() {
    return this.words.length
  },
  addIdToWords() {
    for (let index in this.words) {
      let word = this.words[index]
      word.id = index
    }
  },
  addFrequencyToWords() {
    console.log('Adding frequency to words')
    for (let word of this.words) {
      if (!word.word.includes(' ')) {
        let rank = -1
        rank = this.findRank(word.word)
        word.rank = rank !== -1 ? rank : this.frequency.length
      }
    }
  },
  addFrequencyToPhrases() {
    console.log('adding frequency to phrases')
    if (!this.frequencyAdded) {
      for (let word of this.words.filter(word => word.word.includes(' ') || word.word.includes('-'))) {
        if (word.word.includes(' ') || word.word.includes('-')) {
          let ranks = []
          for (let part of word.word.split(/[ -]/g)) {
            let partRank = this.findRank(part)
            if (partRank === -1) {
              ranks.push(this.frequency.length)
              break
            } else {
              ranks.push(partRank)
            }
          }
          word.rank = Math.pow(Math.max(...ranks), 1.3)
        }
      }
      this.frequencyAdded = true
    }
  },
  maxRank() {
    return this.frequency.length
  },
  assignLevels() {
    let c1 = 10000
    let b2 = c1 / 2
    let b1 = c1 / 2 / 2
    let a2 = c1 / 2 / 2 / 2
    let a1 = c1 / 2 / 2 / 2 / 2
    let zero = c1 / 2 / 2 / 2 / 2 / 2
    for (let word of this.words) {
      word.level = this.levels[7]
      if (word.rank < c1) {
        word.level = this.levels[6]
      }
      if (word.rank < b2) {
        word.level = this.levels[5]
      }
      if (word.rank < b1) {
        word.level = this.levels[4]
      }
      if (word.rank < a2) {
        word.level = this.levels[3]
      }
      if (word.rank < a1) {
        word.level = this.levels[2]
      }
      if (word.rank < zero) {
        word.level = this.levels[1]
      }
    }
  },
  credit() {
    return '英汉词典由<a href="https://github.com/skywind3000/ECDICT">ECDICT</a>提供, 开源并以<a href="https://github.com/skywind3000/ECDICT/blob/master/LICENSE">MIT License</a>发行。'
  },
  f(results) {
    let words = results.data.filter(row => {
      return (row.phonetic.length > 0 && row.frq > 0)
    }).sort((a, b) => b.word.length - a.word.length)
    let csv = Papa.unparse(words)
    console.log(csv)
  },
  /* Returns the longest word in the dictionary that is inside `text` */
  longest(text) {
    text = text.toLowerCase()
    return this.words.find(row => text.includes(row.word.toLowerCase()))
  },
  findPhrases(text) {
    text = text.toLowerCase()
    let phrases = []
    for (let row of this.words.filter(row => row.word.includes(' '))) {
      if (text.includes(row.word.toLowerCase())) {
        phrases.push(row)
      }
    }
    return phrases
  },
  loadTouchstone() {
    console.log('Loading Touchtone...')
    return new Promise(resolve => {
      Papa.parse(this.touchstoneFile, {
        download: true,
        header: true,
        complete: results => {
          for (let index in results.data) {
            let row = results.data[index]
            this.words.push(this.augment(row))
          }
          console.log('Touchtone loaded.')
          resolve()
        }
      })
    })
  },
  augment(row, id) {
    let word = {
      id: id,
      bare: row.word,
      accented: row.word,
      search: row.word.toLowerCase(),
      head: row.word,
      pronunciation: row.phonetic.replace(/:/g, 'ː').replace(/,/g, 'ˌ').replace(/'/g, 'ˈ').replace(/i(?!ː)/g, 'ɪ'),
      definitions: row.translation ? row.translation.split('\\n') : [],
      pos: row.pos,
      extra: row
    }
    if (row.level) {
      word.book = parseInt(row.level)
      word.level = this.levels[parseInt(row.level)]
    }
    return Object.assign(row, word)
  },
  findRank(word) {
    return this.frequency.indexOf(word.toLowerCase())
  },
  /**
   * Get a word by ID.
   * @param {*} id the word's id
   * @param {*} head (optional) the head of the word to check if matches the word retrieved; if mismatched, we'll look for a matching word instead.
   * @returns 
   */
  get(id, head) {
    let word
    word = this.words[id];
    if (head && word.head !== head) {
      word = this.lookup(head)
    }
    return word
  },
  lookup(text) {
    let word = this.words.find(word => word && word.bare.toLowerCase() === text.toLowerCase())
    return word
  },
  lookupMultiple(text) {
    let words = this.words.filter(word => word && word.bare.toLowerCase() === text.toLowerCase())
    return words
  },
  formTable() {
    return this.tables
  },
  wordForms(word) {
    let forms = [{
      table: 'head',
      field: 'head',
      form: word.bare
    }]
    if (word) {
      for (let table of this.formTable()) {
        for (let field of table.fields) {
          if (word[table.name] && word[table.name][field]) {
            for (let form of word[table.name][field].split(',')) {
              forms.push({
                table: table.name,
                field: field,
                form: form.trim()
              })
            }
          }
        }
      }
    }
    return forms
  },
  lookupByDef(text, limit = 30) {
    text = text.toLowerCase()
    let words = this.words
      .filter(word => word.definitions.join(', ').toLowerCase().includes(text))
      .slice(0, limit)
    return words
  },
  lookupFuzzy(text, limit = 30) { // text = 'abcde'
    text = text.toLowerCase()
    let words = []
    let subtexts = []
    for (let i = 1; text.length - i > 3; i++) {
      subtexts.push(text.substring(0, text.length - i))
    }
    for (let word of this.words) {
      let head = word.head ? word.head.toLowerCase() : undefined
      if (head && head.startsWith(text)) {
        words.push(
          Object.assign(
            { score: text.length - (head.length - text.length) },
            word
          )
        ) // matches 'abcde', 'abcde...'
      }
      if (head && text.includes(head)) {
        words.push(Object.assign({ score: head.length - text.length - 4 }, word)) // matches 'cde', 'abc'
      }
      if (head && head.includes(text)) {
        words.push(Object.assign({ score: text.length - (head.length - text.length) - 4 }, word)) // matches 'XXXabcdeWWW'
      }
      for (let subtext of subtexts) {
        if (head && head.includes(subtext)) {
          words.push(
            Object.assign(
              { score: subtext.length - (head.length - subtext.length) },
              word
            )
          ) // matches 'abcxyz...'
        }
      }
    }
    for (let word of words) {
      if (word.book) {
        word.score = word.score + 7 - word.book
      }
    }
    return this.uniqueByValue(words, 'id').sort((a, b) => b.score - a.score).slice(0, limit)
  },
  uniqueByValue(array, key) {
    let flags = []
    let unique = []
    let l = array.length
    for (let i = 0; i < l; i++) {
      if (flags[array[i][key]]) continue
      flags[array[i][key]] = true
      unique.push(array[i])
    }
    return unique
  },
  randomArrayItem(array, start = 0, length = false) {
    length = length || array.length
    array = array.slice(start, length)
    let index = Math.floor(Math.random() * array.length)
    return array[index]
  },
  //https://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
  randomProperty(obj) {
    var keys = Object.keys(obj)
    return obj[keys[(keys.length * Math.random()) << 0]]
  },
  random() {
    return this.randomProperty(this.words)
  },
  accent(text) {
    return text.replace(/'/g, '́')
  },
  stylize(name) {
    const stylize = {
      adjectives: 'adjective',
      incomparable: 'incomparable',
      short_f: 'short (fem.)',
      short_m: 'short (masc.)',
      short_n: 'short (neut.)',
      short_pl: 'short plural',
      superlative: 'superlative',
      conjugations: 'conjugation',
      pl1: 'мы',
      pl2: 'вы',
      pl3: 'они',
      sg1: 'я',
      sg2: 'ты',
      sg3: 'он/она',
      declensions: 'declension',
      decl_sg: 'singular',
      decl_pl: 'plural',
      decl_f: 'feminine',
      decl_m: 'masculine',
      decl_n: 'neuter',
      acc: 'accusative',
      dat: 'dative',
      gen: 'genitive',
      inst: 'instrumental',
      nom: 'nominative',
      prep: 'prepositional',
      verbs: '',
      aspect: 'aspect',
      imperative_pl: 'imperative plural',
      imperative_sg: 'imperative singular',
      partner: 'partner',
      past_f: 'past tense (feminine)',
      past_m: 'past tense (masculine)',
      past_n: 'past tense (neuter)',
      past_pl: 'past tense (plural)'
    }
    return stylize[name]
  },
}