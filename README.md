# MAX_hack26

Эхо-бот на Python для платформы MAX (long polling).

## Запуск

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# впиши BOT_TOKEN в .env
python bot.py
```

`MAX_SSL_VERIFY=0` — обход ошибки сертификата Минцифры. После установки корневых CA поставь `1`.
