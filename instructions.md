0) ОБЯЗАТЕЛЬНО! СНАЧАЛА СДЕЛАТЬ ПОЛНЫЙ БЭКАП БАЗЫ ДАННЫХ (MySQL) - схемы и данных.

1) Скачать данный репозиторий.

2) В папке с репозиторием выполнить `npm install`

3) Скопировать файл `EMPTYconfig.js` рядом с самим собой, переименовать в `congig.js`, прописать в нем данные для доступа к базам данных.

4) Применить к базе данных `pockeuww_data` последовательно (и только в таком порядке) SQL скрипты:

`_1_wipe_data_and_add_primary_keys.sql`

`_2_modify_columns.sql`

5) Запускаем js скрипт командой `node app.js`

6) Ждём. Юзеры обычно довольно быстро обрабатываются (несколько секунд), а вот pocket-practice
может загружаться несколько минут (у меня в среднем 2-4 минуты).
Типовой вывод js скрипта:
```
started
getting users...
users: fetched and successfully updated 122 documents

getting pocket-practice...
pocket-practice: fetched 7008 documents in 276.772 seconds
pocket-practice: fetched and successfully updated 7008 documents,
    timings: couchbase: 276.772 s, mysql: 7.399 s, total: 284.171 s

Process finished with exit code 0
```

Дополнение:

На всякий случай (если вдруг будет нужно), есть SQL скрипт `_revert_1_drop_all_new_primary_keys.sql`,
который отменяет действие первого скрипта (просто удаляет ключ и созданную колонку для первичного ключа).
