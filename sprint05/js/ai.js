'use strict';

// 使用するAPI
// A3RT の Talk API
// https://a3rt.recruit-tech.co.jp/product/



const API_KEY = 'DZZtUcCw3uNYAlUUrdaF8Ylbod1BDTOc';
const API_URL = 'https://api.a3rt.recruit-tech.co.jp/talk/v1/smalltalk';

let output = document.getElementById('output');


init();

function init() {
	document.getElementById('submitButton').addEventListener('click', submitClickHandler, false);
}

function submitClickHandler(ev) {
	let messageText = document.getElementById('messageText');
	let postData = `apikey=${API_KEY}&query=${messageText.value}`;
	callAPI(API_URL, postData).then(onSuccess).catch(onError);
	addMessage(messageText.value, false);
	ev.preventDefault();
	messageText.value = '';
}

function addMessage(message, isAI) {
	let p = document.createElement('p');
	let p_ai = document.createElement('input')
	let button = document.createElement('button');
	let input = document.createElement('input');
	let ul = document.createElement('ul');
	let li_ai = document.createElement('li');
	let li_input = document.createElement('li');
	let form = document.createElement('form');
	form.method = 'POST';
	form.action = './cgi-bin/sentiment.py';
	form.className = 'nav';
	p.value = message;
	if (isAI) {
		p_ai.value = message;
		p.className = 'ai nav-li';
		p_ai.name = 'AI-text';
	

		input.type="submit";
		input.id ='sentimentButton';
		input.className = 'nav-li'
		input.value = '感情診断';
		form.appendChild(p_ai);
		form.appendChild(input);

		
		output.appendChild(form);
	}else{	
		p.textContent = message;
		p.className = 'human';
		output.appendChild(p);
	}
}

function onSuccess(data) {
	let json = JSON.parse(data);
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
		req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
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

function loadScript(url) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	return script
}