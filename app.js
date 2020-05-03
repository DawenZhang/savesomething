const PORT = process.env.PORT || 8888;
const crypto = require('crypto');
const fs = require('fs');
var app = require('express')();
var express = require('express');
var https = require('http').createServer(app);
const puppeteer = require('puppeteer');
const scrollPageToBottom = require('puppeteer-autoscroll-down');
const mhtml2html = require('mhtml2html');
const { JSDOM } = require('jsdom');
var bodyParser = require('body-parser');
(async function main() {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });

    const promiseTimeout = function (ms, promise) {
        let timeout = new Promise((resolve, reject) => {
            let id = setTimeout(() => {
                clearTimeout(id);
                reject('Timed out in ' + ms + 'ms.')
            }, ms)
        })
        return Promise.race([
            promise,
            timeout
        ])
    }

    app.use(express.json({
        limit: '10mb',
        type: ['application/json', 'text/plain']
    }));

    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/savemhtml', function (req, res) {
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        let page_id = crypto.createHash('sha1').update(current_date + random).digest('hex').substr(0, 8);
        try {
            while (fs.existsSync('pages/' + page_id + '.html')) {
                random = Math.random().toString();
                page_id = crypto.createHash('sha1').update(current_date + random).digest('hex').substr(0, 8);
            }
        } catch (err) {
            res.json({ "result_code": "not ok" });
            return;
        }

        const doc = mhtml2html.convert(req.body.mhtml, { convertIframes: false, parseDOM: (html) => new JSDOM(html) });

        fs.writeFile('pages/' + page_id + '.html', doc.serialize(), err => {
            if (err) {
                res.json({ "result_code": "not ok" });
                return;
            }
            res.json({ "result_code": "ok", "page": page_id });
        });
    });

    app.post('/save', async function (req, res) {
        try {
            var current_date = (new Date()).valueOf().toString();
            var random = Math.random().toString();
            let page_id = crypto.createHash('sha1').update(current_date + random).digest('hex').substr(0, 8);
            try {
                while (fs.existsSync('pages/' + page_id + '.html')) {
                    random = Math.random().toString();
                    page_id = crypto.createHash('sha1').update(current_date + random).digest('hex').substr(0, 8);
                }
            } catch (err) {
                res.json({ "result_code": "not ok" });
                return;
            }
            function wait(ms) {
                return new Promise(resolve => setTimeout(() => resolve(), ms));
            }
            const [page] = await browser.pages();

            await page.goto(req.body.page_url, {
                waitUntil: 'networkidle0',
            });

            x = await promiseTimeout(30000, scrollPageToBottom(page, 3, 2));

            await wait(1000);
            const cdp = await page.target().createCDPSession();
            const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });
            const doc = mhtml2html.convert(data, { convertIframes: false, parseDOM: (html) => new JSDOM(html) });
            fs.writeFile('pages/' + page_id + '.html', doc.serialize(), err => {
                if (err) {
                    return console.log(err);
                }
            });

            await page.close();

            res.send(`<!DOCTYPE html>
        <html>
        <header>
        </header>
        
        <body>
        <p>saved to:</p>
        <p>` + "<a href='/saved/" + page_id + "' target='_blank'>" + req.protocol + '://' + req.get('host') + "/saved/" + page_id + "</a>" + `</p>
        </body>
        
        </html>`);
        } catch (err) {
            console.log(err);
            res.send({ "result_code": "error" });
        }
    });

    app.get('/save', function (req, res) {
        res.send(`<!DOCTYPE html>
    <html>
    <header>
    <script type="text/javascript"> 
    function changeText(){
        var submit = document.getElementById("saver");
        submit.value = 'saving...';
        document.getElementById("saverform").submit();
        return false;
    };
</script>
    </header>
    
    <body>
    <p>tasks that may exceed 30 seconds will be shut down</p>
    <p>protocols(http, https, etc) have to be included</p>
    <form id="saverform" action="/save" method="post">
    <label for="page_url">url</label><br>
    <input type="text" id="page_url" name="page_url" value=""><br><br>
    <input id="saver" type="submit" value="save" onclick="return changeText();">
    </form>
    </body>
    
    </html>`);
    });

    app.get('/saved/:page_id', function (req, res) {
        if (fs.existsSync('pages/' + req.params.page_id + '.html')) {
            res.sendFile('pages/' + req.params.page_id + '.html', { root: __dirname });
        } else {
            res.send({ "result_code": req.params.page_id });
        }
    });

    app.get('*', function (req, res) {
        res.send({ "result_code": "cannot open the path" });
    });

    https.listen(PORT, function () {
        console.log('listening on *:' + PORT);
    });
})();