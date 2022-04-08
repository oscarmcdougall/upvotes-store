import { fetch, CookieJar } from "node-fetch-cookies";
import jwt_decode from "jwt-decode";
import promiseRetry from "promise-retry";
import jsdom from "jsdom";
const { JSDOM } = jsdom;
import mongoose from 'mongoose';
import Token from './modules/token.js';

async function grabToken(username, password) {

    return new Promise(async (resolve, reject) => {
        const grabToken = await promiseRetry(async (retry, number) => {

            const cookieJar = new CookieJar();

            const abortControllerLoginPage = new AbortController();
            setTimeout(() => { abortControllerLoginPage.abort() }, 5000);

            const loginPage = await fetch(cookieJar, "https://www.reddit.com/login", { signal: abortControllerLoginPage.signal });
            const loginPageBody = await loginPage.text();

            const pageDom = new JSDOM(loginPageBody);

            if (pageDom.window.document.querySelector(`input[name="csrf_token"]`) == null) {
                console.log(`[${username}] Rate limited, retrying login...`);
                retry();
            }

            const csrfToken = pageDom.window.document.querySelector(`input[name="csrf_token"]`).value;

            console.log(`[${username}] Attempting login...`);

            const abortControllerLogin = new AbortController();
            setTimeout(() => { abortControllerLogin.abort() }, 5000);

            try {
                const loginPost = await fetch(cookieJar, "https://www.reddit.com/login", {
                    signal: abortControllerLogin.signal,
                    method: "POST",
                    body: `csrf_token=${csrfToken}&otp=&password=${password}&dest=https%3A%2F%2Fwww.reddit.com&username=${username}`,
                    headers: {
                        "accept": "*/*",
                        "accept-language": "en-GB,en;q=0.9",
                        "content-type": "application/x-www-form-urlencoded",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "sec-gpc": "1",
                        "Referer": "https://www.reddit.com/login/",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    }
                });

                console.log(`[${username}] Logged in!`);
                console.log(`[${username}] Loading home page...`);

                const abortControllerHomePage = new AbortController();
                setTimeout(() => { abortControllerHomePage.abort() }, 5000);

                const homePage = await fetch(cookieJar, "https://www.reddit.com/", {
                    signal: abortControllerHomePage.signal,
                    headers: loginPost.headers
                });

                var tokenRaw;

                for (var i = 0; i < homePage.headers.raw()['set-cookie'].length; i++) {
                    const foundToken = homePage.headers.raw()['set-cookie'][i];
                    if (foundToken.startsWith("token_v2=")) {
                        tokenRaw = foundToken;
                    }
                }

                const jwtToken = tokenRaw.substring(0, tokenRaw.indexOf(";")).replace("token_v2=", "");

                console.log(`[${username}] CSRF token found, decoding...`);

                const bearerToken = jwt_decode(jwtToken)["sub"];

                console.log(`[${username}] CSRF token decoded!`);

                resolve(bearerToken);
            } catch (error) {
                if (error.name == "AbortError") {
                    console.log(`[${username}] Request timed out.`);
                    console.log(`[${username}] Retrying request...`);
                    retry(error);
                }
            }
        });

        resolve(grabToken);
    });
}

async function getToken(username, password) {
    return new Promise(async (resolve, reject) => {
        const foundToken = await Token.findOne({ username: username });

        if (foundToken) {
            console.log(`[${username}] Cached token found!`);
            return resolve(foundToken);
        }

        console.log(`[${username}] No cached token found, grabbing new token...`);

        const bearerToken = await grabToken(username, password);

        const saveToken = await Token.findOneAndUpdate({ username: username }, { token: bearerToken }, {upsert: true});

        console.log(`[${username}] Token found, stored in cache!`);

        resolve(bearerToken);
    });
}

(async () => {

    await mongoose.connect('mongodb://localhost/upvotes-store');

    for (var i = 0; i < 100; i++) {
        const bearerToken = await getToken("ciiwupzhawksmaet", "LugB97sw5Mo8qhm1");
        console.log(bearerToken);
    }
})();
