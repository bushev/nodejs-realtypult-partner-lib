# nodejs-realtypult-partner-lib [![CircleCI](https://circleci.com/gh/bushev/nodejs-realtypult-partner-lib.svg?style=svg)](https://circleci.com/gh/bushev/nodejs-realtypult-partner-lib)

API библиотека для интеграции с RealtyPult

## Как установить

`npm install nodejs-realtypult-partner-lib --save`


## Как пользоваться

``` js

const Importer = require('../index').Importer;

let importer = new Importer({
    // Ссылка на XML фид из личного кабинета партнера
    xmlFeedUrl: 'https://realtypult.ru/api/xml/export/partner/FORMAT/TOKEN',

    // Файл отчета, будет создаваться автоматически, ссылку на него нужно вставить в личный кабинет партнера
    reportFileLocation: '/var/www/my-site/public/rm-report.xml',

    // Формат XML фида ('realtypult' или 'yandex')
    format: 'realtypult',

    // Функция будет вызвана для каждого объявления из XML фида
    onItem: onItem,

    // Функция будет вызвана когда весь XML фид будет обработан
    onEnd: onEnd,

    // Функция будет вызвана в случае непредвиденной критической ошибки
    onError: onError
});

/**
 * Обработчик одного объявления
 *
 * Требуется реализовать алгоритм:
 *
 * 1. Проверить (по id) размещали ли вы это объявления ранее
 *
 * Если не размещали:
 *      2.1 Сохраните объявление в вашей базе данных (не забудьте скачать себе изображения объекта)
 *      2.2 Вызовите функцию `callback` и передайте в нее ссылку на объявление на вашем сайте,
 *          Например: callback(null, {url: 'http://your-site.ru/item1'}); (где `null` первым параметром
 *          говорит об отсутствии ошибки)
 *
 * Если размещали:
 *      2.1 Проверьте, изменилось ли обновление, если да то обновите его в вашей базе данных (не забудьте
 *           про изображения)
 *      2.2 Получите из вашей базы данных количество просмотров этого объявления (рекомендуется)
 *      2.2 Вызовите функцию `callback` и передайте в нее ссылку на объявление на вашем сайте,
 *          и количество просмотров (рекомендуется)
 *          Например: callback(null, {url: 'http://your-site.ru/item1', views: 15}); (где `null`
 *          первым параметром говорит об отсутствии ошибки)
 *
 *
 * В случае если на каком-либо этапе вы понимаете что это объявление не может быть обработано корректно,
 * вызовите функцию `callback` и передайте ей сообщение об ошибке
 * Например: callback({error: 'Произошел технический сбой'});
 *
 * Помните, что сообщение о об ошибке увидит конечный пользователь!
 *
 * Примеры частых ошибок:
 *
 * - Произошел технический сбой (проблема с базой данных, нет места на диске, и тп)
 * - Неудалось определить адрес объекта
 * - И тп.
 *
 * @param item - объект содержащий всю информацию об объявлении
 * @param callback - функция, которую нужно вызвать когда обработка объявления завершена, и передать
 *                   в нее результат обработки
 */
function onItem(item, callback) {

    console.log(`Обрабатываю объявление: ${item.id}`);

    // callback(null, {url: 'http://your-site.ru/item1', views: 15});
    // ИЛИ
    // callback({error: 'Произошел технический сбой'});
}

/**
 * Обработчик конца импорта
 *
 * Здесь нужно удалить из вашей базы данных все объявления которые отсутствовали в XML фиде (не забудьте
 * удалить изображения)
 *
 * @param report
 * @param report.location - Путь до файла с готовым отчетом (ссылку на него нужно вставить в личный
 *                          кабинет партнера)
 * @param report.statistics.total - Общее число объявление в фиде
 * @param report.statistics.success - Число объявление обработанных успешно
 * @param report.statistics.errors - Число объявление обработанных с ошибками
 */
function onEnd(report) {

    console.log('Обработка XML фида завершена!');
    console.log(report);
}

/**
 * Обработчик ошибки обработки XML фида
 *
 * @param error
 */
function onError(error) {

    console.log(error);
}

// Запускаем импорт
importer.run();
```

Код этого примера надодится [тут](examples/example.js)