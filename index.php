<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Случайная строка</title>
    <meta name="description" content="Вдохните в себя жизнь с помощью нашего генератора случайных цитат на разных языках! На этой странице вы найдёте мудрые мысли, афоризмы и высказывания известных личностей со всего мира. ">
    <link rel="stylesheet" href="style/style.css">
    <link rel="shortcut icon" href="media/favicon.png" type="image/x-icon">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
    <script src="js/backgroundAnimate.js" defer></script>
</head>
<body class="gradient">
    <canvas id="bgCanvas"></canvas>
    <div class="quote-container">
        <a href="#">
            <img src="media/logo.png" alt="LOGO" class="logo">
        </a>
        <h1>Случайная цитата</h1>
        <select id="language-select" class="select-language">
            <option value="any">Все языки</option>
            <option value="ru">Русский</option>
            <option value="en">Английский</option>
            <option value="es">Испанский</option>
            <option value="fr">Французский</option>
            <option value="de">Немецкий</option>
        </select>
        <p id="quote-text">Загрузка...</p>
        <button id="new-quote-button" class="btn-newQuote">Новая цитата</button>
    </div>

    <script>
        const quotesData = <?php
            $quotesFile = 'quotes.json';
            if (file_exists($quotesFile)) {
                $quotesJson = file_get_contents($quotesFile);
                echo $quotesJson;
            } else {
                echo '{"Ошибка": "quotes.json не найден"}';
            }
            ?>;

        function getRandomQuote(language) {
            if (quotesData.error) {
                return "Ошибка: Файл с цитатами не найден.";
            }

            const languages = Object.keys(quotesData.data);
            const selectedLanguage = language || languages[Math.floor(Math.random() * languages.length)];
            const urls = Object.keys(quotesData.data[selectedLanguage]);
            const selectedUrl = urls[Math.floor(Math.random() * urls.length)];
            const quotes = quotesData.data[selectedLanguage][selectedUrl];
            const selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];

            return selectedQuote;
        }

        function updateQuote(language) {
            const quote = getRandomQuote(language);
            document.getElementById('quote-text').textContent = quote;
        }

        
        document.getElementById('new-quote-button').addEventListener('click', function() {
            const selectedLanguage = document.getElementById('language-select').value;
            if(selectedLanguage == 'any'){
                updateQuote();
            } else{
                updateQuote(selectedLanguage);
            }
        });
        
        document.getElementById('language-select').addEventListener('change', function() {
            const selectedLanguage = this.value;
            if(selectedLanguage == 'any'){
                updateQuote();
            } else{
                updateQuote(selectedLanguage);
            }
        });

        updateQuote();
    </script>


</body>
</html>