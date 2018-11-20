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
        <form method="POST" action="/cgi-bin/f13form.py">
            西暦を選んでください: <select name="year">
            %s
            </select>
            <input type="submit" />
        </form>
        
    </body>
</html>
"""

subscription_key = 'c0a58eb3-884e-4811-b5a7-8e1cd24ce129'
assert subscription_key
text_analytics_base_url = "https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/"

sentiment_api_url = text_analytics_base_url + "sentiment"
print(sentiment_api_url)
documents = {'documents' : [
  {'id': '1', 'language': 'en', 'text': 'I had a wonderful experience! The rooms were wonderful and the staff was helpful.'},
  {'id': '2', 'language': 'en', 'text': 'I had a terrible time at the hotel. The staff was rude and the food was awful.'},  
  {'id': '3', 'language': 'en', 'text': 'Los caminos que llevan hasta Monte Rainier son espectaculares y hermosos.'},  
  {'id': '4', 'language': 'en', 'text': 'La carretera estaba atascada. Había mucho tráfico el día de ayer.'}
]}

headers   = {"Ocp-Apim-Subscription-Key": subscription_key}
response  = requests.post(sentiment_api_url, headers=headers, json=documents)
sentiments = response.json()
print(sentiments)


