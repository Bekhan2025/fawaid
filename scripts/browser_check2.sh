#!/usr/bin/env bash
# Вторая проверка: стихи (e64), сноски (e47), клавиатурная навигация, мобильное меню.
set -u
cd /home/z/my-project

pkill -f "next dev" 2>/dev/null; sleep 1
agent-browser close 2>/dev/null

npm run dev > /tmp/dev_out.log 2>&1 &
SERVER_PID=$!
for i in $(seq 1 40); do
  curl -s -o /dev/null http://localhost:3000 && break
  sleep 1
done
echo "server: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000)"

agent-browser set viewport 1440 900
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
sleep 1

# Сноски: e47 «Комментарий к хадису Ибн Мас'уда» — открыть через сайдбар
agent-browser find role button click --name "Часть II: Коран и хадисы — 10 записей"
sleep 0.5
agent-browser find text "Комментарий к хадису Ибн Мас'уда" click
sleep 1.2
agent-browser screenshot /tmp/shot10-footnotes-top.png
# скролл к сноскам внизу
agent-browser eval "window.scrollTo(0, document.body.scrollHeight)"
sleep 0.8
agent-browser screenshot /tmp/shot11-footnotes-end.png

# Клавиатурная навигация: стрелка влево → e41 (сура «Аль-Фатиха»? нет: порядок страниц — e12)
agent-browser press ArrowLeft
sleep 1
agent-browser get text "h1"
agent-browser press ArrowLeft
sleep 1
agent-browser get text "h1"

# Стихи: e64 (Освобождение сердца..., стихи на с. 66)
agent-browser find role button click --name "Часть VII: Сердце и поминание — 20 записей"
sleep 0.5
agent-browser find text "Освобождение сердца от ложного — непременное условие для его привязанности к Аллаху" click
sleep 1.2
agent-browser eval "document.querySelector('.bp-verse')?.scrollIntoView({block:'center'})"
sleep 0.8
agent-browser screenshot /tmp/shot12-verse.png

# Басмала (e8 Предисловие)
agent-browser find role button click --name "Часть I: О книге — 2 записей"
sleep 0.5
agent-browser find text "Предисловие" click
sleep 1.2
agent-browser screenshot /tmp/shot13-basmala.png

# Мобильное меню: развернуть часть III и выбрать запись
agent-browser set viewport 390 844
agent-browser reload
agent-browser wait --load networkidle
agent-browser find role button click --name "Показать или скрыть оглавление"
sleep 0.8
agent-browser find role button click --name "Часть III: Познание Аллаха — 7 записей"
sleep 0.6
agent-browser find text "Кто знает Аллаха лучше всех" click
sleep 1
agent-browser screenshot /tmp/shot14-mobile-selected.png
agent-browser get text "h1"

agent-browser errors
kill $SERVER_PID 2>/dev/null
echo DONE
