#! /usr/bin/env python
# coding:utf-8

import cgi

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
 
content = 'aaaa'
print("Content-type: text/html;charset=utf-8")
print((html_body % content).encode('utf-8'))
