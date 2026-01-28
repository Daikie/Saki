let classifier;
let priceDatabase = []; // JSONから読み込む
const statusText = document.getElementById('status');
const preview = document.getElementById('preview');

async function initApp() {
    try {
        statusText.innerText = 'データを読み込み中...';
        
        // 1. JSONデータベースの読み込み
        const response = await fetch('data.json');
        priceDatabase = await response.json();
        console.log("データベース読み込み完了:", priceDatabase);

        // 2. TensorFlow.js の準備
        await ml5.tf.setBackend('cpu'); 
        await ml5.tf.ready();
        
        // 3. モデルの初期化
        classifier = await ml5.imageClassifier('MobileNet');
        console.log("✅ モデル読み込み完了");
        statusText.innerText = '✅ 準備完了！画像をアップロードしてください';
    } catch (error) {
        console.error("初期化エラー:", error);
        statusText.innerText = '読み込みに失敗しました (data.json があるか確認してください)';
    }
}

initApp();

async function classifyImage() {
    if (!classifier) return;
    statusText.innerText = '査定中...';

    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1000 / preview.naturalWidth); 
    canvas.width = preview.naturalWidth * scale;
    canvas.height = preview.naturalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);

    try {
        const results = await classifier.classify(canvas);
        console.log("解析成功:", results);
        
        // 判定された生の英単語
        const rawLabel = results[0].label;
        displayResult(rawLabel);
    } catch (err) {
        console.error("解析エラー:", err);
        statusText.innerText = '解析に失敗しました';
    }
}

function displayResult(rawLabel) {
    statusText.innerText = '査定完了';
    const lowerLabel = rawLabel.toLowerCase();

    // データベースからキーワード検索
    let match = priceDatabase.find(item => lowerLabel.includes(item.keyword));
    
    // 見つからない場合のデフォルト値
    if (!match) {
        match = { name: "不明なアイテム", price: "---", desc: "データベースに一致する項目がありませんでした。" };
    }

    // 表示反映
    document.getElementById('result').style.display = 'block';
    document.getElementById('label').innerText = match.name;
    document.getElementById('price').innerText = match.price;
    document.getElementById('description').innerText = match.desc;
    
    // 生の認識結果を表示
    document.getElementById('raw-label').innerText = rawLabel;
}

// （ファイル選択・ボタン等のイベントリスナーは前回同様）


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

// テストボタンやアップロード時の処理は前回の preview.onload 経由で OK
document.getElementById('testBtn').onclick = () => {
    preview.src = "teddy.jpeg";
    preview.onload = () => classifyImage();
};
