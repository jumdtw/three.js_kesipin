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
	let postData = `apikey=${API_KEY}&query=${messageText.value}`;
	callAPI(API_URL, postData).then(onSuccess).catch(onError);
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
function callAPI(url, data) {
	return new Promise((resolve, reject) => {
		const req = new XMLHttpRequest();

		req.open('POST', url);
		req.setRequestHeader('Content-Type', 'application/json');
		req.onload = () => {
			if (req.readyState === 4) {
				if (req.status === 200) {
					resolve(req.response);
				} else {
					reject(req.statusText);
				}
			}
		};

		req.onerror = () => {
			reject(req.statusText);
		};

		req.send(data);
	});
}
