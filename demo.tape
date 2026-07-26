Output demo.gif

Set Shell "zsh"
Set FontSize 16
Set Width 1200
Set Height 700
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set BorderRadius 10
Set Padding 16
Set Framerate 24
Set TypingSpeed 60ms

# 事前準備（録画に映らない）
Hide
Type "cd /Users/daikikojima/Work/davy" Enter
Type "docker compose up -d 2>&1 | tail -5" Enter
Sleep 3s
Show

# davy 起動（Homebrew でインストールした davy コマンドを使う）
Type "davy" Enter
Sleep 3s

# プロファイル選択画面 → "davy" プロファイルを選択
Enter
Sleep 4s

# ── シンプルなデータ問い合わせ ──
Type "SELECT * FROM users;"
Sleep 500ms
Ctrl+x
Sleep 3s

# 実行後は結果パネルに自動フォーカスされているので、そのままフォーマット切り替え（table → csv）をちら見せ
Sleep 1s
Type "f"
Sleep 2s

Sleep 2s
Ctrl+c
