const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();

// ポート設定
const PORT = 3000;

// CORSの設定
app.use(cors({
    origin: 'http://127.0.0.1:5500', // フロントエンドのオリジンを指定
    methods: ['GET', 'POST'],    // 許可するHTTPメソッドを指定
    allowedHeaders: ['Content-Type', 'Authorization'],    // 許可するヘッダーを指定
}));

// ミドルウェア設定
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
}));

// POSTリクエストを受け取るエンドポイントの作成
app.post('/saveData', (req, res) => {
    const data = req.body; // リクエストボディからデータを取得

    // 送信者の情報を取得
    const senderInfo = {
        ip: req.ip, // 送信者のIPアドレス
        userAgent: req.get('User-Agent'), // 送信者のブラウザ情報
        sessionId: req.sessionID, // セッションID
        cookies: req.cookies, // クッキー情報
        timestamp: new Date().toLocaleString(), // 現在時刻
    };

    // 送信者の情報とデータを統合
    const dataToSave = {
        sender: senderInfo,
        bodyData: data
    };

    // データの保存処理（ここではファイルに追記）
    fs.appendFile('data.json', JSON.stringify(dataToSave, null, 2) + '\n', (err) => {
        if (err) {
            console.error('Error saving data:', err);
            return res.status(500).json({ message: 'Error saving data' });
        }

        // 成功レスポンス
        res.status(200).json({ message: 'Data saved successfully' });
    });
});

// サーバーを起動
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
