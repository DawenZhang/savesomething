# savesomething
a website to backup webpages

## backend
- ```POST /save```
save a web page from url

- ```POST /savemhtml```
save a web page from existing mhtml file

- ```GET /saved/:page_id```
retrieve a saved web page from its page_id

## chrome extension
the backend site url should replace ```<site url>``` in the extension; the extension saves a mhtml file from the current web page and use the ```POST /savemhtml``` API to save to backend
