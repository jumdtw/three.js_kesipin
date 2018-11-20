#! /usr/bin/env python
# coding:utf-8

import cgi
import requests
import pprint

html_body = u"""
<html>
    <head>
        <meta http-equiv="content-type" content="text/html;charset=utf-8" />
    </head>
    <body>
       %s
    </body>
</html>
"""


form = cgi.FieldStorage()


img_path = './image/normal.png'

img = u'''
<img src="%s" />
'''



#subscription_key = 'c0a58eb3-884e-4811-b5a7-8e1cd24ce129'
subscription_key = '79ec04c07c8f432d9071438b0ef970ae'

assert subscription_key
text_analytics_base_url = "https://eastasia.api.cognitive.microsoft.com/text/analytics/v2.0/"

sentiment_api_url = text_analytics_base_url + "sentiment"
#print(sentiment_api_url)

SENTIMENT = form.getvalue('AI-text','N/A')

documents = {'documents' : [
  {'id': '1', 'language': 'ja', 'text': SENTIMENT},
]}



headers   = {"Ocp-Apim-Subscription-Key": subscription_key,"Content-Type":"application/json"}
response  = requests.post(sentiment_api_url, headers=headers, json=documents)
sentiments = response.json()

print(sentiments)

Score = sentiments.documents[0].score


if(Score>=0.7&&Socre<=1){
    img_path = './image/happy.png'
}elif(Sore<=0.3&&Score>=0){
    img_path = './image/angry.png'
}

img = img%(img_path)

print("Content-type: text/html\n")
print(html_body % (img).encode('utf-8'))


