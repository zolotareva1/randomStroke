<?php
function get_random_quote($filename = 'quotes.json', $language = 'en') {
    if (file_exists($filename)) {
        $json = file_get_contents($filename);
        $data = json_decode($json, true);

        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            return "Ошибка декодирования JSON: " . json_last_error_msg();
        }

        if ($data && is_array($data) && !empty($data)) {
            $all_quotes = [];
            foreach ($data as $url => $translations) {
                if (isset($translations[$language]) && is_array($translations[$language])) {
                    $all_quotes = array_merge($all_quotes, $translations[$language]);
                }
            }

            if (!empty($all_quotes)) {
                $random_key = array_rand($all_quotes);
                return $all_quotes[$random_key];
            } else {
                return "В данных JSON не найдено цитат на языке " . $language . ".";
            }
        } else {
            return "В данных JSON не найдено цитат.";
        }
    } else {
        return "Ошибка: Файл quotes.json не найден.";
    }
}

// Получаем язык из параметра запроса (например, get_random_quote.php?lang=fr)
$language = isset($_GET['lang']) ? $_GET['lang'] : 'en';  // Язык по умолчанию - английский

echo get_random_quote('quotes.json', $language);
?>