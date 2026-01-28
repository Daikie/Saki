// 価格データベース（本来は別JSONファイルにすると管理が楽です）
const priceDatabase = {
    "teddy": { name: "ぬいぐるみ", price: "500〜2,000", desc: "状態やブランドにより変動します。" },
    "toy car": { name: "ミニカー", price: "300〜1,500", desc: "トミカ等のビンテージ品は高値がつくことも。" },
    "block": { name: "積み木/知育玩具", price: "1,000〜4,000", desc: "木製のおもちゃは安定した人気があります。" },
    "doll": { name: "人形", price: "800〜5,000", desc: "関節の緩みや汚れをチェックしてください。" },
    "default": { name: "その他のおもちゃ", price: "100〜", desc: "一般的な中古価格です。" }
};

// ... (priceDatabase の定義はそのまま)

let classifier;
const statusText = document.getElementById('status');
const preview = document.getElementById('preview');

async function initApp() {
    try {
        console.log("TensorFlow.js の準備を確認中...");
        // バックエンドを CPU に強制し、準備ができるまで待機
        await ml5.tf.setBackend('cpu'); 
        await ml5.tf.ready();
        
        console.log("現在のバックエンド:", ml5.tf.getBackend());
        statusText.innerText = 'モデルを読み込み中...';

        // モデルの初期化
        classifier = await ml5.imageClassifier('MobileNet');
        console.log("✅ モデルの読み込み完了");
        statusText.innerText = '✅ 準備完了！画像をアップロードしてください';
    } catch (error) {
        console.error("初期化エラー:", error);
        statusText.innerText = '初期化に失敗しました';
    }
}

// アプリの起動
initApp();

// ... (データベースや initApp はそのまま)

// 2. 画像がアップロードされた時の処理
imageLoader.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("ファイルが選択されました:", file.name, "サイズ:", file.size);
    statusText.innerText = '画像を読み込み中...';

    try {
        // FileReaderをPromise化して、確実に読み込み完了を待つ
        const imageData = await readFileAsDataURL(file);
        
        // preview要素に画像をセット
        preview.src = imageData;
        preview.style.display = 'block';

        // iOS対策: 少し待機してから、画像が本当に表示可能か確認して解析へ
        preview.onload = () => {
            console.log("画像の表示準備が完了しました。解析を開始します。");
            classifyImage();
        };
    } catch (err) {
        console.error("ファイル読み込みエラー:", err);
        statusText.innerText = 'ファイルの読み込みに失敗しました';
    }
});

// Helper: ファイルを読み込むPromise
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

// 判定処理（前回成功した Canvas 経由のロジック）
async function classifyImage() {
    if (!classifier) {
        console.error("モデルが準備できていません");
        return;
    }
    
    statusText.innerText = '査定中...';
    console.log("解析プロセス開始 (Canvas描画経由)");

    const canvas = document.createElement('canvas');
    // iOS Safariでサイズが大きすぎる場合を考慮し、最大幅を1000px程度に制限するのも有効
    const scale = Math.min(1, 1000 / preview.naturalWidth); 
    canvas.width = preview.naturalWidth * scale;
    canvas.height = preview.naturalHeight * scale;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    try {
        const results = await classifier.classify(canvas);
        console.log("解析成功:", results);
        displayResult(results[0].label.toLowerCase());
    } catch (err) {
        console.error("解析エラー:", err);
        statusText.innerText = '解析に失敗しました。もう一度試してください。';
    }
}


// 判定処理（Canvasを介して解析）
async function classifyImage() {
    if (!classifier) return;
    
    statusText.innerText = '査定中...';
    console.log("解析プロセス開始 (Canvas描画経由)");

    // iOS Safari対策: img を直接渡さず Canvas に写してから解析
    const canvas = document.createElement('canvas');
    canvas.width = preview.width || preview.naturalWidth;
    canvas.height = preview.height || preview.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(preview, 0, 0);

    try {
        // 解析実行
        const results = await classifier.classify(canvas);
        console.log("解析成功:", results);
        displayResult(results[0].label.toLowerCase());
    } catch (err) {
        console.error("解析エラー:", err);
        statusText.innerText = '解析に失敗しました';
    }
}

function displayResult(label) {
    statusText.innerText = '査定完了';
    let match = priceDatabase["default"];
    for (let key in priceDatabase) {
        if (label.includes(key)) {
            match = priceDatabase[key];
            break;
        }
    }
    document.getElementById('result').style.display = 'block';
    document.getElementById('label').innerText = match.name;
    document.getElementById('price').innerText = match.price;
    document.getElementById('description').innerText = match.desc;
}

// テストボタンやアップロード時の処理は前回の preview.onload 経由で OK
document.getElementById('testBtn').onclick = () => {
    preview.src = "teddy.jpeg";
    preview.onload = () => classifyImage();
};
