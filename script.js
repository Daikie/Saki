// 価格データベース（本来は別JSONファイルにすると管理が楽です）
const priceDatabase = {
    "teddy": { name: "ぬいぐるみ", price: "500〜2,000", desc: "状態やブランドにより変動します。" },
    "toy car": { name: "ミニカー", price: "300〜1,500", desc: "トミカ等のビンテージ品は高値がつくことも。" },
    "block": { name: "積み木/知育玩具", price: "1,000〜4,000", desc: "木製のおもちゃは安定した人気があります。" },
    "doll": { name: "人形", price: "800〜5,000", desc: "関節の緩みや汚れをチェックしてください。" },
    "default": { name: "その他のおもちゃ", price: "100〜", desc: "一般的な中古価格です。" }
};

let classifier;
const statusText = document.getElementById('status');
const imageLoader = document.getElementById('imageLoader');
const preview = document.getElementById('preview');
const testBtn = document.getElementById('testBtn');

// 1. モデルの読み込み
console.log("モデルの読み込みを開始します...");
classifier = ml5.imageClassifier('MobileNet', () => {
    console.log("✅ モデルの読み込みが正常に完了しました");
    statusText.innerText = '✅ 準備完了！画像をアップロードまたはテストボタンを押してください';
});

// 2. アップロード処理（既存）
imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
});

// 3. サーバー上の teddy.jpeg を読み込む処理
testBtn.addEventListener('click', () => {
    console.log("サンプル画像の読み込みを開始します: teddy.jpeg");
    // preview.onload を先に設定してから src を代入する
    preview.onload = () => {
        console.log("サンプル画像のデコードが完了しました。解析を開始します。");
        classifyImage();
    };
    preview.src = "teddy.jpeg"; // 同じディレクトリのファイルを指定
    preview.style.display = 'block';
});

// 画像が読み込まれたら自動的に解析する（アップロード時も対応）
preview.onload = () => {
    if (preview.src) {
        classifyImage();
    }
};

// 4. 解析処理
function classifyImage() {
    statusText.innerText = '査定中...';
    console.log("ml5の解析（classify）を実行...");

    // ml5のメソッドに直接DOM要素を渡す
    classifier.classify(preview, (err, results) => {
        console.log("コールバック関数内に入りました"); // ここが表示されるか確認
        if (err) {
            console.error("解析エラー:", err);
            statusText.innerText = '解析中にエラーが発生しました';
            return;
        }

        console.log("解析成功:", results);
        const topResult = results[0].label.toLowerCase();
        statusText.innerText = '査定完了';
        
        let match = priceDatabase["default"];
        for (let key in priceDatabase) {
            if (topResult.includes(key)) {
                match = priceDatabase[key];
                break;
            }
        }

        document.getElementById('result').style.display = 'block';
        document.getElementById('label').innerText = match.name;
        document.getElementById('price').innerText = match.price;
        document.getElementById('description').innerText = match.desc;
    });
}
