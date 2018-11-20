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


img_path = '../image/normal.png'

img = u"""
<img src="%s" />
"""



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

#print(sentiments)
Scor = sentiments["documents"]
Score1 = Scor[0]

Score = Score1['score']

if(Score>=0.7 or (Score<=1)):
    img = '<img src="../image/happy.png" />'
    #img_path = './image/happy.png'
elif((Score<=0.3) or (Score>=0)):
    img = '<img src="../image/angry.png" />'
    #img_path = './image/angry.png'




print("Content-type: text/html\n\n")
print((html_body % (img)).encode('utf-8'))


