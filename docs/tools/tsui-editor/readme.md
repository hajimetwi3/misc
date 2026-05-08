## Tsui editor  
ブラウザでローカルファイルを編集するシンプルなエディタ。ログイン不要、インストール不要、データの外部送信無し。完全オフライン利用も可能。もちろん広告も一切無し。データ収集もしていません。あなたのプライバシーを侵害しません。  

## スクリーンショット  

<img width="480" alt="image" src="./images/tsui1.1.jpg" />  

## 動作要件  
現状、Chromium 系のみ対応（chrome、Edgeで動きます）  

## 使い方

1. [https://tsuieditor.pages.dev/](https://tsuieditor.pages.dev/) をブラウザから直接開く  
2. PWAとしてインストール(インストールしなくても良い）  
3. 完全オフラインで利用したい場合、[https://github.com/hajimetwi3/misc/blob/main/docs/tools/tsui-editor/tsui-editor.html](https://github.com/hajimetwi3/misc/blob/main/docs/tools/tsui-editor/tsui-editor.html) をダウンロードしてブラウザから開き利用する事も可能。


※ よりセキュアな環境にするため、Webサイト版のURLに変更が入りました。ユーザーデータ自体には、影響ありません。新しい環境へご移行をお願いいたします。  
新：https://tsuieditor.pages.dev/  
旧：https://hajimetwi3.github.io/misc/tools/tsui-editor/tsui-editor.html  
　　（※旧版ももう少しの間、継続して稼働予定）    


## ライセンス  

- 本アプリ本体 → [MIT License](./LICENSE)  

## 作った人  

[Hajime Tsui](https://hajimetwi3.github.io/hajimetwi3/)  

---  
## 注意事項  
- 本サービスは現状のまま提供されており、動作の保証はありません。利用によって生じた損害について、作成者は一切の責任を負いません。自己責任でご利用ください。
- ⚠ 権限に関する重要な注意
  - このアプリは、ブラウザのFile System Access API経由で、選択したフォルダ配下のすべてのファイルに対して読み書き・削除の権限を持ちます。  
    そのため、以下のようなシステム的・個人的に重要なフォルダの選択は避けてください。
      - "C:\\" / "/" などルート直下  
      - Desktop / Documents / Downloads  
      - OneDrive / iCloud / Dropbox の同期フォルダ  
      - Git リポジトリや開発プロジェクトのルート  
  - このエディタ専用に作業フォルダ（例: <code>C:\\tsui-workspace\\</code>）を作る事を強く推奨します。

---  
## 外部送信していない事の確認方法  
DevToolsのNetworkタブ等でご確認いただけますと幸いです。  

---  
## アナウンス  
- note.comで記事を公開中です。  
  [https://note.com/hajimetwi3/n/n5a3475a672c0](https://note.com/hajimetwi3/n/n5a3475a672c0)

- Xでもアナウンスしています。  
  [https://x.com/hajimetwi3/status/2045759208130568283](https://x.com/hajimetwi3/status/2045759208130568283)
  
---  
## 障害情報  
Androidで日本語フォルダ名を用いると、ファイルを保存する際にエラーが発生するという事象が発生することがあるようです。  
⇒ 最初に指定するフォルダ名に日本語を使わない事で回避することが可能です。  


