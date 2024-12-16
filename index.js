const express = require('express');
const bodyParser = require('body-parser');
const { Storage } = require('@google-cloud/storage');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

// 認証されたクライアントオブジェクトを作成します
const storage = new Storage();

// 環境変数からバケット名を取得
const bucketName = process.env.BUCKET_NAME;

// ファイル名を指定（必要に応じて変更してください）
const fileName = 'data.json';

const app = express();

// CORSの設定
// Cloud Run は異なるオリジンから呼び出されることが多いため、ワイルドカードの使用を検討してください
app.use(cors({
    origin: true, // すべてのオリジンを許可する場合
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ミドルウェア設定
app.use(bodyParser.json());
app.use(cookieParser());

// Cloud Run では express-session の代わりに、Cloud Storage や Cloud Memorystore などを利用してセッション情報を管理することを検討してください。
// 以下は、セッション管理を簡易的に省略した例です。
// app.use(session({
//     secret: 'mysecretkey',
//     resave: false,
//     saveUninitialized: true,
// }));

// POSTリクエストを受け取るエンドポイント
app.post('/', async (req, res) => {
    const data = req.body;

    // 送信者の情報を取得
    const senderInfo = {
        ip: req.headers['x-forwarded-for'] || 'unknown', // Cloud Run でも同様に x-forwarded-for ヘッダーを確認
        userAgent: req.get('User-Agent'),
        // Cloud Run ではセッション管理が異なるため、ここではセッションIDを省略
        // sessionId: req.sessionID, 
        cookies: req.cookies,
        timestamp: new Date().toLocaleString(),
    };

    const dataToSave = {
        sender: senderInfo,
        bodyData: data
    };

    try {
        // バケット名が設定されているか確認
        if (!bucketName) {
            throw new Error("BUCKET_NAME environment variable is not set.");
        }

        // 既存のデータを取得
        let existingData = [];
        try {
            const [fileContent] = await storage.bucket(bucketName).file(fileName).download();
            existingData = JSON.parse(fileContent.toString());
        } catch (error) {
            // ファイルが存在しない場合はエラーが発生するが、無視して新しい配列を作成
            if (error.code !== 404) {
                throw error;
            }
        }

        // 新しいデータを追加
        existingData.push(dataToSave);

        // Cloud Storage にデータを書き込む
        await storage.bucket(bucketName).file(fileName).save(JSON.stringify(existingData, null, 2));

        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data: ' + error.message });
    }
});

// 環境変数 PORT で指定されたポート、または 8080 でリッスン
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});