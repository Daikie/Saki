// ... (priceDatabaseの定義はそのまま)

let classifier;
const statusText = document.getElementById('status');
const imageLoader = document.getElementById('imageLoader');
const preview = document.getElementById('preview');

// 1. モデルの読み込み
console.log("モデルの読み込みを開始します...");
classifier = ml5.imageClassifier('MobileNet', () => {
    console.log("✅ モデルの読み込みが正常に完了しました");
    statusText.innerText = '✅ 準備完了！画像をアップロードしてください';
});

// 2. 画像がアップロードされた時の処理
imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log("画像ファイルを受け取りました:", file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
        console.log("プレビュー表示完了。解析へ進みます...");
        
        // 画像が完全に読み込まれるのを待ってから解析
        preview.onload = () => {
            console.log("画像デコード完了。classifyImageを実行します。");
            classifyImage();
        };
    };
    reader.readAsDataURL(file);
});

// 3. 画像解析と結果表示
function classifyImage() {
    statusText.innerText = '査定中...';
    console.log("ml5の解析（classify）を開始します...");

    // classifierが定義されているか確認
    if (!classifier) {
        console.error("エラー: classifierが初期化されていません");
        return;
    }

    classifier.classify(preview, (err, results) => {
        if (err) {
            console.error("解析中にエラーが発生しました:", err);
            statusText.innerText = 'エラーが発生しました';
            return;
        }

        console.log("解析成功！結果データ:", results);

        // 解析結果の取得
        const topResult = results[0].label.toLowerCase();
        console.log("トップ判定ラベル:", topResult);
        
        statusText.innerText = '査定完了';
        
        let match = priceDatabase["default"];
        for (let key in priceDatabase) {
            if (topResult.includes(key)) {
                match = priceDatabase[key];
                console.log("データベースにマッチしました:", key);
                break;
            }
        }

        // 画面に反映
        document.getElementById('result').style.display = 'block';
        document.getElementById('label').innerText = match.name;
        document.getElementById('price').innerText = match.price;
        document.getElementById('description').innerText = match.desc;
    });
}
