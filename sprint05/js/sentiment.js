'use strict';

// 使用するAPI
// A3RT の Talk API
// https://a3rt.recruit-tech.co.jp/product/

const API_KEY = '79ec04c07c8f432d9071438b0ef970ae';
const API_URL = 'https://eastasia.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';

let output = document.getElementById('output');

init();

function init() {
	document.getElementById('sentimentButton').addEventListener('click', submitClickHandler, false);
}

function submitClickHandler(ev) {
	let messageText = document.getElementById('messageText');
    const requestBody = {
      "documents": [
        {
          "language": "en",
          "id": "1",
          "text": messageText,
        }
      ]
    };
	callAPI(API_URL, requestBody).then(onSuccess).catch(onError);
	// 自分が打ったメッセージをチャット欄に表示する
	addMessage_and_image(messageText.value, false);
	ev.preventDefault();
	messageText.value = '';
}
function addMessage_and_image(message, isAI) {
	let p = document.createElement('p');
	if (isAI) {
		p.className = 'ai';
	}
	p.textContent = message;
	output.appendChild(p);
}


function onSuccess(data) {
	let json = JSON.parse(data);
	// 人工知能が返してきたメッセージをチャット欄に表示する
	console.log(json);
	addMessage(json.results[0].reply, true);
}

function onError(error) {
	console.log(error);
}

// POSTメソッドで呼び出し、JSONで結果が返ってくる
function callAPI(API_URL, data) {
	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest();

		req.open('POST', API_URL);
		req.setRequestHeader('Content-Type', 'application/json');
		request.setRequestHeader("Ocp-Apim-Subscription-Key", "79ec04c07c8f432d9071438b0ef970ae"); // Set API key.
		req.onload = () => {
			const resultList = document.getElementById('output');
			const li = document.createElement('li');
			resultList.appendChild(li);
		};

		req.onerror = () => {
			reject(req.statusText);
		};

		req.send(data);
	});
}
