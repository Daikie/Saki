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

// 1. モデルの読み込み
classifier = ml5.imageClassifier('MobileNet', () => {
    statusText.innerText = '✅ 準備完了！画像をアップロードしてください';
});

// 2. 画像がアップロードされた時の処理
imageLoader.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = 'block';
        // 画像解析開始
        classifyImage();
    };
    reader.readAsDataURL(file);
});

// 3. 画像解析と結果表示
function classifyImage() {
    statusText.innerText = '査定中...';
    classifier.classify(preview, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }

        // 解析結果の取得（一番確率が高いもの）
        const topResult = results[0].label.toLowerCase();
        statusText.innerText = '査定完了';
        
        // データベースから照合
        let match = priceDatabase["default"];
        for (let key in priceDatabase) {
            if (topResult.includes(key)) {
                match = priceDatabase[key];
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

