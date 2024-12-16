# Node.js の公式イメージを使用
FROM node:16

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# アプリケーションの依存関係をコピーしてインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションを実行するコマンドを指定
CMD [ "npm", "start" ]