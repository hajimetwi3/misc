'use strict';
(function () {
  const pipBtn = document.getElementById('pip-btn');
  const pipRow = document.querySelector('.panel-pip');
  const noticeEl = document.getElementById('notice');
  const supported = 'documentPictureInPicture' in window;

  // 非対応ブラウザでは PIP行自体を非表示
  if (!supported) {
    if (pipRow) pipRow.style.display = 'none';
    return;
  }

  // 通知(トースト風)表示
  let noticeTimer = null;
  function showNotice(message) {
    if (!noticeEl) return;
    noticeEl.textContent = message;
    noticeEl.classList.add('open');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      noticeEl.classList.remove('open');
    }, 3500);
  }

  async function openAsPiP() {
    try {
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 420,
        height: 220
      });

      // 現在の document 全体を複製して PiP 側にコピー
      // (スタイル・フォント・設定属性をまるごと持ち込む)
      const clone = document.documentElement.cloneNode(true);

      // PiP 側 body を初期化(innerHTML を使わずに除去)
      const pipBody = pipWindow.document.body;
      while (pipBody.firstChild) pipBody.removeChild(pipBody.firstChild);

      // PiP 側に <html> 相当をコピー
      // clone は <html> そのものなので、属性とhead/bodyを反映
      // <head> の中身(meta, link, style)をPiP側の<head>にマージ
      const pipHead = pipWindow.document.head;
      const cloneHead = clone.querySelector('head');
      if (cloneHead) {
        Array.from(cloneHead.children).forEach((node) => {
          // script タグはコピーしない(後で app.js だけを意図して読ませる)
          if (node.tagName === 'SCRIPT') return;
          pipHead.appendChild(node.cloneNode(true));
        });
      }

      // <html> の data-* 属性(テーマ・FX・BG 等)をPiP側<html>に転写
      const pipHtml = pipWindow.document.documentElement;
      Array.from(document.documentElement.attributes).forEach((attr) => {
        if (attr.name.startsWith('data-')) {
          pipHtml.setAttribute(attr.name, attr.value);
        }
      });

      // clone の body 配下から .clock だけをPiP側bodyに配置
      // (設定パネル、モーダル、PiPボタン、noticeは持ち込まない)
      const cloneClock = clone.querySelector('.clock');
      if (cloneClock) {
        // PiP 用に id を変えずにそのまま使う(app.jsが getElementById で拾う)
        pipBody.appendChild(cloneClock);

        // .clock 要素に直接インラインstyle適用(外部CSSより強い)
        // 角丸は元のstyle.cssの border-radius:10px を維持するため指定しない
        cloneClock.style.cssText += `
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6px 12px;
          max-width: none;
          cursor: default;
        `;

        // .time と .date は子要素なので querySelector で取得
        // 横幅/縦幅の小さい方を基準に文字サイズを決定(どんな比率でも潰れない)
        const cloneTime = cloneClock.querySelector('.time');
        const cloneDate = cloneClock.querySelector('.date');
        if (cloneTime) {
          cloneTime.style.cssText += `
            font-size: clamp(48px, min(22vw, 62vh), 180px);
          `;
        }
        if (cloneDate) {
          cloneDate.style.cssText += `
            font-size: clamp(12px, min(4.5vw, 14vh), 34px);
          `;
        }
      }

      // PiP 専用のベーススタイル(html/bodyのみ)
      const pipStyle = pipWindow.document.createElement('style');
      pipStyle.textContent = `
        html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
        body { display: flex; }
      `;
      pipHead.appendChild(pipStyle);

      pipWindow.document.title = 'Tsui Clock';

      // PiP 側で時計ロジック(app.js)のみを実行
      // pip.js 自体は読み込まない → 二重実行や再帰を防ぐ
      const script = pipWindow.document.createElement('script');
      script.src = './app.js';
      pipHead.appendChild(script);

    } catch (err) {
      // ユーザーがキャンセルした場合も含め、エラーは notice で控えめに表示
      showNotice('PiPを開けませんでした');
      console.error('[pip]', err);
    }
  }

  pipBtn.addEventListener('click', openAsPiP);
})();
