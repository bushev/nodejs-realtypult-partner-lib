/**
 *
 * Created by Yuriy Bushev <bushevuv@gmail.com> on 25/12/2016.
 */

'use strict';

const Importer = require('../index').Importer;

let importer = new Importer({
    xmlFeedUrl: 'https://realtypult.ru/api/xml/export/partner/FORMAT/TOKEN', // Ссылка на XML фид из личного кабинета партнера
    reportFileLocation: '/Users/bushev/Downloads/rm-report.xml', // Путь к файлу отчета, файл будет создаваться автоматически
    format: 'realtypult', // Формат XML фида ('realtypult' или 'yandex')
    onItem: onItem, // Функция будет вызвана для каждого объявления из XML фида
    onEnd: onEnd, // Функция будет вызвана когда весь XML фид будет обработан
    onError: onError // Функция будет вызвана в случае непредвиденной критической ошибки
});

// Запускаем импорт
importer.run();

/**
 * Обработчик одного объявления
 *
 * Требуется реализовать алгоритм:
 *
 * 1. Проверить (по item.id) размещали ли вы это объявления ранее
 *
 * Если не размещали:
 *      2.1 Сохраните объявление в вашей базе данных (не забудьте скачать себе изображения объекта)
 *      2.2 Вызовите функцию `callback` и передайте в нее ссылку на объявление на вашем сайте,
 *          Например: callback({url: 'http://your-site.ru/item1'});
 *
 * Если размещали:
 *      2.1 Проверьте, изменилось ли обновление, если да то обновите его в вашей базе данных
 *          (не забудьте про изображения)
 *      2.2 Получите из вашей базы данных количество просмотров этого объявления (рекомендуется)
 *      2.2 Вызовите функцию `callback` и передайте в нее ссылку на объявление на вашем сайте,
 *          и количество просмотров (рекомендуется)
 *          Например: callback({url: 'http://your-site.ru/item1', views: 15});
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
 * > Произошел технический сбой (проблема с базой данных, нет места на диске, и тп)
 * > Неудалось определить адрес объекта
 * > И тп.
 *
 * В случае если в вашей базе данных есть очень похожее объявление, вызовите `callback` и
 * передайте в него ссылку на это объявление (размещать это объявление не нужно)
 * Например: callback({similarUrl: 'http://your-site.ru/item2'});
 *
 * В случае если вы не можете разместить объявление в силу нарушений ваших правил, вызовите `callback` и
 * передайте в него сообщение пользователю
 * Например: callback({rejectReason: 'Номер телефона заблокирован'});
 *
 * Примеры частых ошибок:
 *
 * > Номер телефона заблокирован
 * > Слишком низкая цена для этого объявления
 * > И тп.
 *
 * Помните, что сообщение об отклонении объявления увидит конечный пользователь!
 *
 * @param item - объект содержащий всю информацию об объявлении
 * @param callback - функция, которую нужно вызвать когда обработка объявления завершена, передать в нее результат
 */
function onItem(item, callback) {

    console.log(`Обрабатываю объявление: ${item.id}`);

    // callback({url: 'http://your-site.ru/item1', views: 15}); // Успешно размещено
    // ИЛИ
    // callback({error: 'Произошел технический сбой'}); // Проблема с доступом к базе данных
    // ИЛИ
    // callback({similarUrl: 'http://your-site.ru/item2'}); // Объявление дубликат
    // ИЛИ
    // callback({rejectReason: 'Номер телефона заблокирован'}); // Не соответствует правилам вашего портала
}

/**
 * Обработчик конца импорта
 *
 * Здесь нужно удалить из вашей базы данных все объявления которые отсутствовали в XML фиде (не забудьте удалить изображения)
 *
 * @param report
 * @param report.location - Путь до файла с готовым отчетом (ссылку на него нужно вставить в личный кабинет партнера)
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