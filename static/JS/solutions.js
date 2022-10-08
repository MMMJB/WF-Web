const TrieNode = function (key) {
  this.key = key;
  
  this.parent = null;
  
  this.children = {};
  
  this.end = false;
  
  this.getWord = function() {
    let output = [];
    let node = this;

    while (node !== null) {
      output.unshift(node.key);
      node = node.parent;
    }

    return output.join('');
  };
}

const Trie = function() {
  this.root = new TrieNode(null);
  
  this.insert = function(word) {
    let node = this.root;

    for(let i = 0; i < word.length; i++) {
      if (!node.children[word[i]]) {
        node.children[word[i]] = new TrieNode(word[i]);

        node.children[word[i]].parent = node;
      }

      node = node.children[word[i]];

      if (i == word.length-1) {
        node.end = true;
      }
    }
  };
  
  this.contains = function(word) {
    let node = this.root;

    for(let i = 0; i < word.length; i++) {
      if (node.children[word[i]]) {
        node = node.children[word[i]];
      } else {
        return false;
      }
    }

    return node.end;
  };
  
  this.find = function(prefix) {
    let node = this.root;
    let output = [];

    for(let i = 0; i < prefix.length; i++) {
      if (node.children[prefix[i]]) {
        node = node.children[prefix[i]];
      } else {
        return output;
      }
    }

    findAllWords(node, output);

    return output;
  };
  
  const findAllWords = (node, arr) => {
    if (node.end) {
      arr.unshift(node.getWord());
    }

    for (let child in node.children) {
      findAllWords(node.children[child], arr);
    }
  }

  this.remove = function (word) {
    let root = this.root;

    if(!word) return;

    const removeWord = (node, word) => {

        if (node.end && node.getWord() === word) {

            let hasChildren = Object.keys(node.children).length > 0;

            if (hasChildren) {
                node.end = false;
            } else {
                node.parent.children = {};
            }

            return true;
        }

        for (let key in node.children) {
            removeWord(node.children[key], word)
        }

        return false
    };

    //removeWord(root, word);
  };
}

async function evalSols(words, input, checking = false, amount = undefined) {
  var size, sols = [], end = false;

  let M = BOARD_SIZE, N = BOARD_SIZE;

  function isWord(str) {
    if (dict.has(str)) return true;
    else return false;
  }
  
  function findWordsUtil(boggle, visited, explored, i, j, str) {
    if (checking && sols.length >= amount) return end = true;

    visited[i][j] = true;
    str += boggle[i][j];
  
    if (isWord(str) && !explored.has(str) && !words.has(str)) {
      explored.add(str);
      sols.push(str);
    }

    if (trie.find(str).length == 0) {
        str = "" + str[str.length - 1];
        visited[i][j] = false;
        return;
    };

    for (var row = i - 1; row <= i + 1 && row < M; row++)
    for (var col = j - 1; col <= j + 1 && col < N; col++)
        if (row >= 0 && col >= 0 && !visited[row][col])
        findWordsUtil(boggle, visited, explored, row, col, str);

    str = "" + str[str.length - 1];
    visited[i][j] = false;
  }

  function findWords(boggle) {
    var visited = Array.from(Array(M), () => new Array(N).fill(0));
    var explored = new Set();
    
    var str = "";

    for (var i = 0; i < M; i++)
    for (var j = 0; j < N; j++) if (!end) findWordsUtil(boggle, visited, explored, i, j, str);
  
    size = explored.size;
  }

  let narr = [];
  for (let i = 0; i < M; i++) {
    narr.push([])

    for (let j = 0; j < N; j++) {
      narr[i].push(input[i * BOARD_SIZE + j].char.toUpperCase());
    }
  }

  findWords(narr);
  return sols;
}

function findWord(word, board) {
  word = word.toLowerCase();
  var end = false;
  
  word.split("").forEach(c => {
    if (board.filter(t => t.char == c).length == 0) return end = true;
  })

  if (end) return false;

  var path = new Set();

  function find(ti, char) {
    let y = Math.floor(ti / BOARD_SIZE);
    let x = ti%BOARD_SIZE;

    let b = new Array(BOARD_SIZE).fill("").map((_, i) => board.slice(i * BOARD_SIZE, (i + 1) * BOARD_SIZE));
    let s = BOARD_SIZE - 1;

    let adj = [
      x<s?b[y][x + 1]:undefined,
      x<s&&y<s?b[y + 1][x + 1]:undefined,
      y<s?b[y + 1][x]:undefined,
      x>0&&y<s?b[y + 1][x - 1]:undefined,
      x>0?b[y][x - 1]:undefined,
      x>0&&y>0?b[y - 1][x - 1]:undefined,
      y>0?b[y - 1][x]:undefined,
      x<s&&y>0?b[y - 1][x + 1]:undefined
    ]

    let viable = [];

    adj.forEach(d => {
      if (d?.char == char) viable.push(d);
    })

    return viable;
  }

  var viableTiles = [], adding = [], startTiles;

  for (c in word) {
    if (c == 0) {
      startTiles = board.filter(e => e.char == word[c]);
      viableTiles = [...startTiles];
      continue;
    }
    
    viableTiles.forEach(t => {
      let next = find(board.indexOf(t), word[c]);
      if (next.length == 0) return;

      next.forEach(n => {
        if (path.has(n)) return;
        
        path.add(n);
        adding.push(n);
      })
    })

    if (adding.length == 0) return false;

    viableTiles = [...adding];
    adding = [];
  }

  return true;
}
