import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
import time
import os
import random

CACHE_FILE = "quotes.json"
CACHE_EXPIRY = timedelta(days=1)
SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es']
LIBRETRANSLATE_URL = "http://localhost:8080/translate"
MAX_CONCURRENT_REQUESTS = 5
translation_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

def delete_div(code, tag, arg):
    for div in code.find_all(tag, arg):
        div.decompose()

async def fetch_url(session, url):
    try:
        async with session.get(url) as response:
            response.raise_for_status()
            return await response.text()
    except aiohttp.ClientError as e:
        print(f"Ошибка при получении {url}: {e}")
        return None

async def clear_text_async(session, url):
    try:
        html_code = await fetch_url(session, url)
        if not html_code:
            print(f"Не удалось получить контент для {url}")
            return []
        soup = BeautifulSoup(html_code, "html.parser")
        region_content = soup.find('div', {"class": 'region-content'})
        if not region_content:
            print(f"Не найден div с классом region-content для {url}")
            return []

        delete_div(region_content, "div", {'class': 'rate-widget-1'})
        delete_div(region_content, "div", {'class': 'field-name-field-quote-picture'})
        delete_div(region_content, "div", {'class': 'field-type-taxonomy-term-reference'})
        delete_div(region_content, "div", {'class': 'node__topics'})
        delete_div(region_content, "div", {'class': 'quote__meta'})
        delete_div(region_content, "div", {'class': 'pagination'})
        delete_div(region_content, "div", {'class': 'node__series'})
        delete_div(region_content, "div", {'class': 'quote__original'})
        delete_div(region_content, 'pre', '')
        delete_div(region_content, 'code', '')

        quotes = []
        quote_elements = region_content.find_all('div', class_='field-item')
        for quote_element in quote_elements:
            text = quote_element.get_text(strip=True)
            text = " ".join(text.split())
            if text:
                quotes.append(text)
        return quotes

    except Exception as e:
        print(f"Ошибка при обработке {url}: {e}")
        return []

async def get_all_quotes_async(topic_url='https://citaty.info/topic', num_random_pages=4):
    all_quotes = {}
    urls = []

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(topic_url) as response:
                response.raise_for_status()
                html_code = await response.text()
    except aiohttp.ClientError as e:
        print(f"Ошибка при получении URL тем: {e}")
        return all_quotes

    soup = BeautifulSoup(html_code, "html.parser")
    s = soup.find('div', {"id": 'list-content-wrapper'})
    if not s:
        print("Не найден div с id list-content-wrapper")
        return all_quotes

    for tag in s.select("div:has(a)"):
        url = tag.find("a")["href"]
        urls.append(url)

    if len(urls) > num_random_pages:
        random_urls = random.sample(urls, num_random_pages)
    else:
        random_urls = urls

    async with aiohttp.ClientSession() as session:
        for url in random_urls:
            quotes = await clear_text_async(session, url)
            if quotes:
                all_quotes[url] = quotes
    return all_quotes

async def translate_quote(session, text, target_language):
    async with translation_semaphore:
        try:
            data = {
                'q': text,
                'source': 'auto',
                'target': target_language,
                'format': 'text'
            }
            async with session.post(LIBRETRANSLATE_URL, data=data) as response:
                response.raise_for_status()
                return (await response.json())['translatedText']
        except aiohttp.ClientError as e:
            print(f"Ошибка при переводе на {target_language}: {e}")
            return text
        except (KeyError, json.JSONDecodeError) as e:
            print(f"Ошибка при обработке ответа LibreTranslate: {e}")
            return text

def load_cache(filename=CACHE_FILE):
    """Loads the translated quotes from the cache file, if it exists and is not expired."""
    if os.path.exists(filename):
        try:
            with open(filename, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                if 'timestamp' in cache_data and datetime.now() - datetime.fromisoformat(cache_data['timestamp']) < CACHE_EXPIRY:
                    print("Loaded quotes from cache.")
                    return cache_data['data']
                else:
                    print("Cache expired.")
                    return {}
        except (FileNotFoundError, json.JSONDecodeError):
            print("Cache file not found or invalid.")
            return {}
    else:
        return {}

async def save_quotes_to_json(quotes_dict, filename=CACHE_FILE):
    cache = load_cache(filename)
    translated_quotes = {'ru': {} }

    async with aiohttp.ClientSession() as session:
        for url, quotes in quotes_dict.items():
            translated_quotes['ru'][url] = quotes
        for language in SUPPORTED_LANGUAGES:
            translated_quotes[language] = {}
            for url, ru_quotes in translated_quotes['ru'].items():
                translated_quotes[language][url] = []
                tasks = []

                for quote in ru_quotes:
                    cache_key = f"{url}_{quote}_{language}"
                    if cache and url in cache and language in cache[url] and quote in cache[url][language]:
                        translated_quotes[language][url].append(cache[url][language][quote])
                    else:
                        tasks.append((quote, language, url))

                if tasks:
                    translated_results = await asyncio.gather(*(translate_quote(session, task[0], task[1]) for task in tasks))
                    for i, result in enumerate(translated_results):
                        quote, language, url = tasks[i]
                        translated_quotes[language][url].append(result)

    json_data = {
        'timestamp': datetime.now().isoformat(),
        'data': translated_quotes
    }

    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)
        print(f"Цитаты сохранены в {filename}")
    except Exception as e:
        print(f"Ошибка при сохранении в JSON: {e}")

async def main():
    all_quotes = await get_all_quotes_async()
    await save_quotes_to_json(all_quotes)

if __name__ == "__main__":
    async def run_periodic():
        while True:
            await main()
            await asyncio.sleep(86400)

    asyncio.run(run_periodic())