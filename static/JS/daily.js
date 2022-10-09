if (new Date().getMonth() == 9) {
    let link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "/static/ASSETS/Seasonal/Halloween/CSS/halloween-h.css";

    document.querySelector("head").appendChild(link);
}


const table = document.querySelector("table.table.leaderboard > tbody");

var board = [], tableValues = [], cMinutes, cHours, endTime, ps, day;
const BOARD_SIZE = 4;
const NUM_VOWELS = 6;

async function getDailies() {
    const d = await fetch("/static/dailies.json").then(r => r.text());

    const start = 1665291600000;
    day = Math.floor((Date.now() - start) / 86400000);

    endTime = start + ((day + 1) * 86400000);

    ps = new Math.seedrandom(JSON.parse(d)[day]);
}

function generateBoard(seed = ps) {
    board = [];

    const chars = ["lrstn", "bcdghmp", "fjkqvwxyz"];
    chars.forEach((c, i) => chars[i] = c.split(""));
    const vowels = "aeiou".split("");

    let seeds = Array.from({length: Math.pow(BOARD_SIZE, 2) + 1}, () =>
        seed()
            .toString()
            .substring(2)
            .split('')
            .map(Number)
            .map(n => (n || 10) + 64)
            .map(c => String.fromCharCode(c))
            .join('')
            .substring(0, 6)
    );
    let random = Array.from(seeds, s => new Math.seedrandom(s));

    let vowelPos = [];
    for (let i = 0; i < NUM_VOWELS; i++) {
        function generateVowels() {
            let rand = Math.floor(random[random.length - 1]() * (Math.pow(BOARD_SIZE, 2)));

            if (vowelPos.includes(rand)) generateVowels();
            else vowelPos.push(rand);
        }

        generateVowels();
    }

    for (let i = 0; i < Math.pow(BOARD_SIZE, 2); i++) {
        if (vowelPos.includes(i)) {
            let char = vowels[Math.floor(random[random.length - 1]() * vowels.length)];
            let pool = char=="u"?1:0;

            board[i] = {
                char: char,
                index: i,
                lives: 3 - pool,
                pool: pool
            }
        }
        else {
            let index = board.length;

            let pool = Math.floor(random[index]() * 6);
            pool = pool <= 2 ? 0 : pool >= 3 && pool <= 4 ? 1 : 2;
            let rand = Math.floor(random[index]() * chars[pool].length);

            let output = chars[pool][rand];

            board[index] = {
                char: output,
                index: index,
                lives: 3 - pool,
                pool: pool
            }
        }
    }
}

function generateTiles() {
    const container = document.createElement("div");
    container.className = "board-display";

    board.forEach(t => {
        container.innerHTML += `
            <div class="tile wood flipped"></div>
        `
    })

    document.getElementById("top").appendChild(container);

    let i = 0;
    const tiles = document.querySelectorAll(".tile");

    let flipTiles = setInterval(() => {
        if (i == 7) return clearInterval(flipTiles);

        let flipping = [];

        if (i <= 3) for (let j = i; j >= 0; j--) {
            tiles[((i - j) * 4) + j].classList.remove("flipped");
            flipping.push(((i - j) * 4) + j);
        } else for (let j = 3; j >= 3 - (6 - i); j--) {
            tiles[((i - j) * 4) + j].classList.remove("flipped");
            flipping.push(((i - j) * 4) + j);
        }

        setTimeout(() => {
            flipping.forEach(t => {
                tiles[t].innerText = board[t].char.toUpperCase();
                tiles[t].dataset.lives = board[t].lives;
            })
        }, 125)

        i++;
    }, 100);
}

function initiate() {
    try {
        function getCookie(cookie) {
            let ret;

            document.cookie.split("; ").forEach(c => {
                let split = c.split("=");
                let val = split.slice(1).join("=")

                if (split[0] == cookie) ret = val
            })

            return ret;
        }

        let xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                tableValues = [...JSON.parse(xmlHttp.responseText)];
                tableValues.sort((a, b) => b.score - a.score)

                for (let i = 0; i < tableValues.length; i++) {
                    table.innerHTML += `
                        <tr class="table-row leaderboard">
                            <td class="table-cell leaderboard placement "data-num="${i + 1}"></td>
                            <td class="table-cell leaderboard score">${tableValues[i].score.toLocaleString()}</td>
                            <td class="table-cell leaderboard user">${tableValues[i].username}</td>
                        </tr>
                    `;
                }

                if (tableValues.length == 0) table.classList.add("empty");
            } else if (xmlHttp.status == 400) {
                table.classList.add("empty");
                document.querySelector(".no-content").innerText = xmlHttp.responseText;
            }
        }
        xmlHttp.open("GET", "https://wordflip.net/api/v1/leaderboard", true);
        xmlHttp.setRequestHeader("Authorization", `${btoa(unescape(encodeURIComponent(getCookie("ses"))))}`)
        xmlHttp.send(null);
    } catch(error) {
        console.log(error);
    }
}

function getDist() {
    const dist = endTime - Date.now();

    let seconds = Math.floor(dist / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds = seconds % 60;
    minutes = minutes % 60;

    function pad(num) {
        return num.toString().padStart(2, '0');
    }

    return {hours: pad(hours), minutes: pad(minutes)};
}

window.onload = () => {
    initiate();

    getDailies().then(() => {
        generateBoard(ps);
        generateTiles();

        document.querySelector(".board-display").onclick = e => {
            if (!e.target.classList.contains("n-loggedIn") && !e.target.parentElement.classList.contains("n-loggedIn")) window.location = `/game?mode=60000&daily=${day}`;
        }

        if (window.localStorage.loggedIn == "true") document.querySelector(".board-display").classList.add("loggedIn");
        else document.querySelector(".board-display").classList.add("n-loggedIn");

        setInterval(() => {
            if (getDist().minutes == cMinutes) return;

            let t = getDist();

            cMinutes = t.minutes;
            cHours = t.hours;

            document.querySelector(".time > .minutes").innerText = cMinutes;
            document.querySelector(".time > .hours").innerText = cHours;
        }, 10)
    })
}

document.querySelector(".button.home").onclick = () => {
    window.location = "/";
}