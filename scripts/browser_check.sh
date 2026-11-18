#!/usr/bin/env bash
# Проверка читалки в браузере: слои, навигация, темы, мобильная версия.
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

TAB_BOOK='Слой «Книга»: текст издания «Умма», 2013'
TAB_RAZBOR='Слой «Разбор»: тезисы и ключевые мысли'
TAB_ATLAS='Слой «Атлас»: шкалы, схемы, карточки'

agent-browser set viewport 1440 900
agent-browser open http://localhost:3000
agent-browser wait --load networkidle
sleep 1
agent-browser screenshot /tmp/shot1-book.png
echo "--- errors:"
agent-browser errors

# Слой «Разбор» (e310 — готов)
agent-browser find role tab click --name "$TAB_RAZBOR"
sleep 1
agent-browser screenshot /tmp/shot2-razbor.png

# Слой «Атлас»
agent-browser find role tab click --name "$TAB_ATLAS"
sleep 1
agent-browser screenshot /tmp/shot3-atlas.png

# Возврат в «Книгу», навигация «Следующая» (в порядке страниц: e315)
agent-browser find role tab click --name "$TAB_BOOK"
agent-browser find role button click --name "Следующая запись: Раб Аллаха преодолевает путь, ведущий к Аллаху, переходя от остановки к остановке своим сердцем и стремлениями, а не телом"
sleep 1
agent-browser screenshot /tmp/shot4-next-book.png
agent-browser get text "h1"

# Заглушка разбора на неготовой записи
agent-browser find role tab click --name "$TAB_RAZBOR"
sleep 1
agent-browser screenshot /tmp/shot5-placeholder.png

# Тёмная тема (сначала в «Книгу»)
agent-browser find role tab click --name "$TAB_BOOK"
agent-browser find role button click --name "Переключить тему: дневная бумага или ночь"
sleep 1
agent-browser screenshot /tmp/shot6-dark.png

# Мобильная версия
agent-browser set viewport 390 844
agent-browser reload
agent-browser wait --load networkidle
sleep 1
agent-browser screenshot /tmp/shot7-mobile.png

# Мобильное меню
agent-browser find role button click --name "Показать или скрыть оглавление"
sleep 1
agent-browser screenshot /tmp/shot8-mobile-menu.png
# выбор записи из меню
agent-browser find text "Коран о качествах Всевышнего Аллаха и Его отношении к Своим рабам" click
sleep 1
agent-browser screenshot /tmp/shot9-mobile-entry.png
agent-browser get text "h1"

agent-browser errors
kill $SERVER_PID 2>/dev/null
echo DONE
