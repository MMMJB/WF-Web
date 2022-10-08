if (new Date().getMonth() == 9) {
    let link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "/static/ASSETS/Seasonal/Halloween/CSS/halloween-h.css";

    document.querySelector("head").appendChild(link);
}


const home = () => {

document.querySelector(".w-error.continue").addEventListener("click", () => document.getElementById("w-error").classList.add("hidden"))

document.addEventListener("contextmenu", (e) => e.preventDefault());

document.querySelectorAll(".timed-options > *").forEach(e => {
    e.addEventListener("click", () => {
        location.replace(`/game?mode=${e.dataset.value}`);
    })
})

document.querySelector(".option.daily").onclick = () => {
    location.replace("/daily");
}

function op(e) {
    let target = e.target;
    if (target.classList.contains("decoration")) return;

    if (document.querySelector(".option.timed").classList.contains("open")) {
        document.querySelector(".option.timed").classList.remove("open");
    }
    target.classList.toggle("open");
}

var announcements = {
    social: "Social features are not yet implemented.",
    sound: "Check out the chrome extension for sound and more!",
    online: "You aren't online!"
}

function announce(e, msg = undefined) {
    if (!document.getElementById("announcer").classList.contains("hidden")) return;

    if (msg !== undefined) document.getElementById("announcer").innerText = announcements[msg];
    else if (e.target.classList.contains("settings")) document.getElementById("announcer").innerText = announcements.sound;
    else document.getElementById("announcer").innerText = announcements.social;
    
    document.getElementById("announcer").classList.remove("hidden");

    setTimeout(() => {
        document.getElementById("announcer").classList.add("hidden");
    }, 2500)
}

function changeVisibility(elm) {
    if (!navigator.onLine) return announce(elm, "online")

    elm = elm.target;
    if (!elm.classList.contains("account") && !elm.id == "user-menu") return;
    if (elm.classList.contains("account")) elm = document.getElementById("user-menu");

    if (elm.classList.contains("hidden")) {
        elm.classList.add("animating");
        elm.classList.remove("hidden");
    } else elm.classList.add("hidden");
}

document.querySelector(".settings.button").onclick = announce;
document.querySelectorAll(".play.button, .option.timed").forEach(e => e.onclick = op);
document.querySelectorAll(".account, #user-menu").forEach(e => e.onclick = changeVisibility);
document.querySelector("#user-menu").childNodes.forEach(e => e.onclick = function(event) { event.stopPropagation(); })


function handleCredentialResponse(response) {
    let decoded = jwtDecode(response.credential);

    handleUser({name: decoded.name, picture: decoded.picture, type: "google", uid: `g${decoded.sub}`});
}

window.onload = function () {
    let ud = getCookie("ud");

    if (ud != undefined) {
        getUser(ud, function(response) {
            if (response == "failed") return logOut();
            else setupUser({...JSON.parse(response)});
        })
    }

    google.accounts.id.initialize({
        client_id: "655505357947-cvesi8q086n318a16le3l1l9tu178ff2.apps.googleusercontent.com",
        auto_select: "true",
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.querySelector(".google"),
        { theme: "outline", size: "large", shape: "pill", text: "continue_with" }  // customization attributes
    );

    if (window.localStorage["loggedIn"] !== "true") document.querySelector(".account.button").classList.add("n-logged-in");
}


var token;

window.fbAsyncInit = () => {
    FB.init({
        appId: "621118822927052",
        autoLogAppEvents: true,
        xfbml: true,
        version: "v14.0",
        status: false
    })
}

document.querySelector(".fb.login-button").onclick = fbLogin;

function fbLogin() {
    FB.login(function(response) {
        if (response.authResponse) {
            token = response.authResponse.accessToken;

            FB.api(`/me?fields=id,name,picture&access_token=${token}`, function(response) {
                handleUser({name: response.name, picture: response.picture.data.url, type: "fb", uid: `f${response.id}`});
            })
        } else console.log("Failed to complete facebook authorization.");
    })
}

function setupUser(response) {
    window.localStorage["loggedIn"] = "true";
    document.querySelector(".account.button").classList.remove("n-logged-in")
    if (response.jwt) document.cookie = `ud=${response.jwt}`;

    const cont = document.querySelector(".content.loggedIn");

    cont.querySelector(".login-title > .bold").innerText = `${response.username}!`;
    cont.querySelector(".login-title > .bold").title = response.username;
    cont.querySelector(".login-subtext > .bold").innerText = `${response.account.name}.`
    cont.querySelector(".login-nusername").classList.remove("changing");
    cont.querySelector(".error").title = "";

    const table = cont.querySelector(".userData");
    const cells = table.querySelectorAll("td");

    [...cells].forEach((c, i) => {
        let col = i % 2;
        let row = Math.floor(i / 2);

        let time = row == 0 ? 30000 : row == 1 ? 60000 : 120000;
        let val = col == 0 ? "highscore" : "plays"

        c.innerText = response.gameData[time][val];
    })

    document.getElementById("user-options").dataset.loggedin = "true";
}

function getCookie(cookie) {
    let ret;

    document.cookie.split("; ").forEach(c => {
        let split = c.split("=");
        let val = split.slice(1).join("=")

        if (split[0] == cookie) ret = val
    })

    return ret;
}

function handleUser(user) {
    if (user == undefined) return;

    let session = getCookie("ses");

    if (session == undefined) console.warn("Invalid session key! Things may not work as intended.");

    getUser(user.uid, function(response) {
        setupUser({...JSON.parse(response)});
    }, {...user});
}

function getUser(uid, callback, args = undefined) {
    if (getUser.caller != handleUser.toString() && getUser.caller != window.onload.toString()) return console.error("Login origin could not be verified.");

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            callback(xmlHttp.responseText);
        } else if (xmlHttp.status.toString()[0] == "4") console.error("Something went wrong.", xmlHttp.status);
    }
    xmlHttp.open("GET", "https://wordflip.net/api/v1/users", true);
    if (args !== undefined) xmlHttp.setRequestHeader("u-data", JSON.stringify({...args, username: parseInt(uid.substring(1)).toString(36).substr(0, 6)}))
    else xmlHttp.setRequestHeader("u-data", JSON.stringify({uid: uid}))
    xmlHttp.setRequestHeader("Authorization", `${btoa(unescape(encodeURIComponent(getCookie("ses"))))}`)
    xmlHttp.send(null);
}

function logOut() {
    document.cookie = "ud=;expires=Thu, 01 Jan 1970 00:00:01 GMT";
    window.localStorage["loggedIn"] = false;
    document.getElementById("user-options").dataset.loggedin = "false";
}

document.querySelector(".logout-icon").onclick = logOut;

const changeUN = () => {
    const button = document.querySelector(".login-nusername");
    const input = button.querySelector("input");
    const submitBtn = button.querySelector(".submit");
    const error = button.querySelector(".error");

    var processing = false;

    button.onclick = openInput;
    button.querySelector(".prompt-text").onclick = openInput;
    submitBtn.onclick = submit;
    error.onclick = shPopup;

    function openInput() {
        if (button.classList.contains("changing")) return;
        button.classList.add("changing");
    }

    function submit() {
        if (processing) return;
        processing = true;

        const txt = input.value;
        var msg;

        if (txt.length < 3 || txt.length > 11) msg = "Username must be between 3 and 11 characters."
        else if (!txt.match(/^[A-Za-z0-9]+$/)) msg = "Username can only contain A-Z and 0-9."
        else {
            error.title = "";

            let xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4) {
                    let response = JSON.parse(xmlHttp.responseText);

                    if (response["status"] == "failure") {
                        msg = response["reason"];
                        error.title = msg;
                        error.querySelector(".error-popup").innerText = msg;
                        processing = false;
                    } else {
                        document.cookie = `ud=${response["cookie"]}`;
                        document.querySelector(".error").firstChild.nodeValue = "✅";
                        msg = "Successfully changed username.";
                        location.reload();
                    }
                }
            }
            xmlHttp.open("POST", `https://wordflip.net/api/v1/users/un?username=${txt}`, true);
            xmlHttp.setRequestHeader("Authorization", `${btoa(unescape(encodeURIComponent(getCookie("ses"))))}`)
            xmlHttp.send(null);
        }

        error.title = msg;
        error.querySelector(".error-popup").innerText = msg;
        processing = false;
    }

    function shPopup(e) {
        e.target.classList.toggle("open");
    }
}

changeUN();

}

home();