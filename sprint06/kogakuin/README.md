# team7 消しピン

## 考えられるバグ
- node.jsの使用がよくわかっていないが、通信終了後socketの削除していないっぽいので長期稼働させるといずれ処理重くなって止まるかも。


## 解決したバグ
- vscodeのせいなのかしらないが、コードの最上部に勝手に`import ~`が追加されることがあった。
- socketでデータを送る際、親切にも要素のデータ量が多いと*勝手に*その要素を含まないデータを送るため、送る前と送った後ではデータが違うものになっていたことがあった。
- `camera.lookAt`は`renderer.render`の前に実行しないと意味がない
- javascriptにおけるdelete演算子はオブジェクトのプロパティしか消さないらしくオブジェクトそのものは消さないらしい。これのせいでroom生成がうまくいかなかった
- 

## 参考文献

### コーディング

three.js-cannon.js実験用
- https://github.com/jumdtw/three.js_cannon.js

ICS MEDIA
- https://ics.media/tutorial-three/index.html

サーバ処理などの参考
- https://paiza.hatenablog.com/entry/paizacloud_online_multiplayer_game

ベクトル計算(2Dの時)
- http://marupeke296.com/

衝突時の計算(２Dの時)
- https://hakuhin.jp/as/collide.html

localstrage
- http://wp.tech-style.info/archives/742

three.jsの使い方参考
- http://jsdo.it/cx20/qhUk  


全面テクスチャ  
- https://nogson2.hatenablog.com/entry/2017/05/15/184849  


マリオ  
- http://jsdo.it/cx20/yG5a  


cannon.js  
- https://qiita.com/o_tyazuke/items/3481ef1a31b2a4888f5d  


add F  
- http://css-eblog.com/webgl/cannonjs.html  


ビリヤード  
- https://liginc.co.jp/378458  


反発係数　摩擦係数  
- https://qiita.com/DAI788/items/4d7397e7918eb9be6d81  


速度ベクトル  
- http://www7.plala.or.jp/kfb/program/stg2dvec.html 


three.js 公式ドキュメント  
- https://threejs.org/ 

cannon.js 公式ドキュメント
- http://www.cannonjs.org/

画面resize
- https://ics.media/tutorial-three/renderer_resize.html

socket.io doc
- https://socket.io/docs/client-api/#io-url-options

progressber.js 
- https://bagelee.com/design/javascript/create_progress_bars_with_progressbarjs/

### 画像

数字部分
- http://www.toriho-dai.com/number/

黒板
- http://gahag.net/tag/%E9%BB%92%E6%9D%BF/

床
- https://www.photo-ac.com/main/search/?q=%E5%A3%81&srt=dlrank


