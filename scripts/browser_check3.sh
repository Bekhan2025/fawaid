#!/usr/bin/env bash
# Третья проверка: раскрыть все части, затем eval-клики по записям.
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

agent-browser eval "document.querySelectorAll('[id^=\"part-btn-\"]').forEach(b => { if (b.getAttribute('aria-expanded') === 'false') b.click() })"
sleep 1
agent-browser eval "document.querySelectorAll('[id^=\"part-btn-\"]').length + ' частей, раскрыто: ' + document.querySelectorAll('[aria-expanded=\"true\"][id^=\"part-btn-\"]').length"

# --- e47: сноски
agent-browser eval "document.querySelector('button[title*=\"Комментарий к хадису Ибн Мас\"]').click()"
sleep 1.4
agent-browser get text "h1"
agent-browser eval "var s=document.querySelector('.bp .book-fnref'); s ? 'маркеры сносок есть: ' + document.querySelectorAll('.book-fnref').length : 'маркеров нет'"
agent-browser eval "document.querySelector('.book-footnotes')?.scrollIntoView({block:'center'})"
sleep 0.8
agent-browser screenshot /tmp/shot15-e47-footnotes.png

# --- e64: стихи
agent-browser eval "document.querySelector('button[title*=\"Освобождение сердца от ложного\"]').click()"
sleep 1.4
agent-browser get text "h1"
agent-browser eval "document.querySelectorAll('.bp-verse').length + ' стих. блоков'"
agent-browser eval "document.querySelector('.bp-verse')?.scrollIntoView({block:'center'})"
sleep 0.8
agent-browser screenshot /tmp/shot16-e64-verse.png

# --- e8: басмала
agent-browser eval "document.querySelector('button[title=\"Введение: Предисловие (с. 8)\"]').click()"
sleep 1.4
agent-browser get text "h1"
agent-browser eval "document.querySelectorAll('.bp-center').length + ' центрированных'"
agent-browser screenshot /tmp/shot17-e8-basmala.png

# --- e175
agent-browser eval "document.querySelector('button[title*=\"Виды покидания Корана\"]').click()"
sleep 1.4
agent-browser get text "h1"
agent-browser screenshot /tmp/shot18-e175.png

# --- e465 (последняя)
agent-browser eval "document.querySelector('button[title*=\"Истинная сущность связи раба с Господом\"]').click()"
sleep 1.4
agent-browser get text "h1"
agent-browser eval "window.scrollTo(0, document.body.scrollHeight)"
sleep 0.8
agent-browser screenshot /tmp/shot19-e465-end.png

agent-browser errors
kill $SERVER_PID 2>/dev/null
echo DONE
