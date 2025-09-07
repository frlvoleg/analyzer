scoring_spec.json
{
  "schema_version": "1.0",
  "window_12m": "2024-09-07 to 2025-09-07",
  "primary_defs": {
    "PRIMARY_WINDOW_days": 7,
    "PRIMARY_MULTIPLIER_x": 2.0,
    "EARLY_LAG_MIN_days": 5,
    "ALT_WINDOWS": ["24h", "3d", "7d", "14d"]
  },
  "normalization": {
    "grouping": ["chain", "category"],
    "method": "percentile_rank_12m",
    "notes": "Перцентили считаются по окну 12м в группе (цепь × категория) для устранения бета-эффектов."
  },
  "features": [
    {
      "name": "TVL_level",
      "desc": "Текущий TVL протокола (лог-масштаб)",
      "source": "DeFiLlama Airdrops/Protocol pages",
      "ref": "https://docs.llama.fi/; https://defillama.com/airdrops",
      "norm": "percentile_rank_12m by (chain×category)",
      "direction": "higher_better (within [P35;P85])",
      "weight_block": "TVL_block"
    },
    {
      "name": "TVL_mom_7d",
      "desc": "Относительный прирост TVL за 7 дней",
      "source": "DeFiLlama",
      "norm": "percentile_rank_12m",
      "direction": "higher_better",
      "weight_block": "TVL_block"
    },
    {
      "name": "TVL_mom_30d",
      "desc": "Относительный прирост TVL за 30 дней",
      "source": "DeFiLlama",
      "norm": "percentile_rank_12m",
      "direction": "higher_better",
      "weight_block": "TVL_block"
    },
    {
      "name": "TVL_conc_chain",
      "desc": "Концентрация TVL по сетям (HHI)",
      "source": "DeFiLlama",
      "norm": "minmax within group",
      "direction": "lower_better (penalty)"
    },
    {
      "name": "has_recent_raise",
      "desc": "Есть ранний раунд ≤ 9 мес. до T_event",
      "source": "DeFiLlama Raises (csv/json)",
      "ref": "https://defillama.com/raises",
      "type": "boolean",
      "direction": "true_better",
      "weight_block": "Investors_block"
    },
    {
      "name": "investor_quality",
      "desc": "Байес-сглаженный ROI фонда (Retail/Private) за 12м",
      "source": "DropsTab Investors",
      "ref": "https://dropstab.com/investors",
      "norm": "percentile_rank_12m by fund_class",
      "direction": "higher_better",
      "weight_block": "Investors_block"
    },
    {
      "name": "co_investor_clique",
      "desc": "В раунде ≥2 фонда из верхнего квартиля ROI",
      "source": "DropsTab/CryptoRank",
      "type": "boolean",
      "direction": "true_better",
      "weight_block": "Investors_block"
    },
    {
      "name": "launchpad_1Y_ROI_pct",
      "desc": "Перцентиль 1Y Current ROI площадки",
      "source": "CryptoRank Fundraising Platforms",
      "ref": "https://cryptorank.io/fundraising-platforms",
      "norm": "percentile across active launchpads",
      "direction": "higher_better",
      "weight_block": "Launchpad_block"
    },
    {
      "name": "launchpad_7d_above_sale_coef",
      "desc": "Коэфф. доли проектов с ценой ≥ sale в первые 7д",
      "source": "CryptoRank",
      "type": "binary_above_median",
      "direction": "true_better",
      "weight_block": "Launchpad_block"
    },
    {
      "name": "tw_growth_30d_pct",
      "desc": "Перцентиль роста фолловеров X за 30д",
      "source": "Official X/Twitter + API",
      "ref": "https://developer.x.com/en/docs/tutorials/measure-tweet-performance",
      "norm": "percentile_rank_12m by (chain×category)",
      "direction": "higher_better",
      "weight_block": "Social_block"
    },
    {
      "name": "tw_engagement_rate",
      "desc": "ER: (likes+replies+RT)/followers, медиана по N последних постов",
      "source": "Official X/Twitter + API",
      "norm": "percentile_rank_12m",
      "direction": "higher_better",
      "weight_block": "Social_block"
    },
    {
      "name": "discord_growth_30d_pct",
      "desc": "Рост Discord участников 30д",
      "source": "Discord server stats (official)",
      "norm": "percentile_rank_12m",
      "direction": "higher_better",
      "weight_block": "Social_block"
    },
    {
      "name": "is_on_llama_airdrops",
      "desc": "Присутствует в списке DeFiLlama Airdrops",
      "source": "DeFiLlama",
      "type": "boolean",
      "direction": "true_better",
      "weight_block": "Airdrop_block"
    },
    {
      "name": "points_program_activity",
      "desc": "Официально объявленная поинтс/фарм программа (интенсивность)",
      "source": "Official blog/X/Discord",
      "norm": "ordinal (0,1,2)",
      "direction": "higher_better",
      "weight_block": "Airdrop_block"
    },
    {
      "name": "security_incident_90d",
      "desc": "Публичный инцидент безопасности за 90д",
      "source": "Project blog/X + aggregators",
      "type": "boolean",
      "direction": "false_better",
      "weight_block": "Risk_adjustment"
    },
    {
      "name": "unlock_heaviness",
      "desc": "Доля разлоков на TGE vs peers (площадка/категория)",
      "source": "Launchpad docs/terms",
      "norm": "percentile within launchpad/category",
      "direction": "lower_better",
      "weight_block": "Risk_adjustment"
    },
    {
      "name": "wash_spike_flag",
      "desc": "Аномальные соц-спайки при низком ER",
      "source": "X/Discord",
      "type": "boolean",
      "direction": "false_better",
      "weight_block": "Risk_adjustment"
    }
  ],
  "blocks": {
    "TVL_block": {"formula": "0.6*TVL_mom_30d + 0.3*TVL_mom_7d + 0.1*TVL_level"},
    "Investors_block": {"formula": "0.7*investor_quality + 0.3*co_investor_clique"},
    "Social_block": {"formula": "0.6*tw_engagement_rate + 0.3*tw_growth_30d_pct + 0.1*discord_growth_30d_pct"},
    "Launchpad_block": {"formula": "0.7*launchpad_1Y_ROI_pct + 0.3*launchpad_7d_above_sale_coef"},
    "Airdrop_block": {"formula": "0.6*is_on_llama_airdrops + 0.4*points_program_activity"},
    "Risk_adjustment": {"formula": "1 - clip(0.5*security_incident_90d + 0.3*unlock_heaviness + 0.2*wash_spike_flag,0,1)"}
  },
  "final_score": {
    "formula": "S = 0.25*TVL_block + 0.25*Investors_block + 0.20*Social_block + 0.20*(Launchpad_block or Airdrop_block) + 0.10*Risk_adjustment",
    "decision_rules": {
      "go": "S >= 0.60 AND >=2 independent signal classes above screening thresholds",
      "borderline": "0.50 <= S < 0.60 (test-size entry/points-only)",
      "no_go": "S < 0.50 OR hard negative overrides"
    }
  },
  "screening_thresholds": {
    "TVL_level": "[P35;P85]",
    "TVL_mom_30d": ">= P65",
    "TVL_mom_7d": ">= P60",
    "tw_engagement_rate": ">= P60",
    "tw_growth_30d_pct": ">= P60",
    "investor_quality": ">= P55 (or co_investor_clique=true)",
    "launchpad_1Y_ROI_pct": ">= P60",
    "launchpad_7d_above_sale_coef": ">= median",
    "negative_flags": "security_incident_90d=false AND unlock_heaviness<=median"
  },
  "uncertainty": {
    "hit_rate_interval": "Wilson score 95%",
    "bayes_smoothing": {"alpha": 2, "beta": 8}
  }
}

filters_for_scouting.md
# Фильтры для скрининга (последние 12 месяцев)

Период анализа: 2024-09-07 → 2025-09-07 (rolling). Группировка: (цепь × категория). Цель: получить «лонг-лист» для этапа B.

## DeFiLlama (Airdrops / TVL / Raises)
1) **Airdrops** → выгрузить .csv списка tokenless, отфильтровать свою категорию/цепь.
   - Оставить проекты с `TVL_level ∈ [P35;P85]` по группе.
   - Оставить `TVL_mom_30d ≥ P65` и `TVL_mom_7d ≥ P60`.
   - Пометить `is_on_llama_airdrops = 1`.
2) **Protocol pages** → получить исторические TVL для расчёта импульса (если нет в выгрузке).
3) **Raises** → выгрузить .csv/.json; выбрать раунды ≤ 9 мес. до предполагаемого события; сопоставить инвесторов.
   Источники: DeFiLlama Docs/Methodology, Airdrops, Raises.

## DropsTab (Investors)
- Открыть вкладку **Investors** → выгрузить «Retail ROI / Private ROI» за 12м по фондам.
- Выбрать проекты, где в раннем раунде присутствуют фонды `investor_quality ≥ P55` (по своему классу) или есть «качественный синдикат» (≥2 фонда верхнего квартиля).

## CryptoRank (Launchpads / Funds)
- **Fundraising Platforms** → применить фильтр timeframe = **1Y**.
  - Выбрать площадки `launchpad_1Y_ROI_pct ≥ P60`.
  - Проверить, что коэффициент «цена ≥ sale в первые 7д» ≥ медианы.
- **Funds** → использовать верификацию состава синдикатов/активности.

## ICODrops (вспомогательно)
- Смотреть **Twitter Performance** / «Investors» для быстрой ориентировки, **использовать только перцентиль** по активным/апкаминговым проектам за 12м (методика непрозрачна).

## Соцметрики
- X/Twitter API: собрать фолловеры по датам, ER (likes+replies+RT)/followers для N последних постов; посчитать перцентили по (цепь × категория).

Комментарии по воспроизводимости

Все пороги — перцентильные на 12-месячном окне и могут быть восстановлены из выгрузок:
DeFiLlama Airdrops (.csv), Raises (.csv/.json), CryptoRank (дашборды/методика ROI и 7d-коэфф.), DropsTab Investors (портфели/ROI), X/Twitter API для соцметрик.
DeFi Llama
+1
CryptoRank
DropsTab
X Developer

Методика TVL и трактовки импульса опирается на официальные доки DeFiLlama.
DefiLlama

Обоснование значимости соц-активности — академические работы (2022–2024).
InK
Tem Journal
Pubs Online

Что ещё можно усилить (но не утверждаем сейчас)

Учёт on-chain пользователей/транзакций (Dune/фирменные дашборды) — вне приоритета источников в брифе.

GitHub-активность — легко манипулируется, используем только косвенно.

Локальные ценовые прокси (OTC, pre-market IOU) — редко доступны прозрачно до события.

Ссылки, на которые опирается алгоритм

DeFiLlama методология TVL/подсчёты по цепям и примеры методик протоколов.
DefiLlama
DeFi Llama

Обзор TVL как ключевого метрика (пояснение).
DL News

DeFiLlama Airdrops — корпус tokenless, выгрузки.
DeFi Llama
+1

DeFiLlama Raises/Investors — раунды, инвесторы, csv/json.
DeFi Llama
+1

DropsTab Investors — ROI фондов/портфелей.
DropsTab

CryptoRank Launchpads (метрики ROI/7d-коэфф.).
CryptoRank

Влияние соц-активности (академические исследования 2022–2024).
InK
Tem Journal
Pubs Online

Twitter API — измеримость ER/исторического роста.
X Developer

ICODrops — карточки с «Twitter Performance» (используем только как перцентиль).
ICO Drops
Алгоритм скоринга ранних крипто-проектовНа основе анализа предыдущих отчётов (DR-1, DR-2, DR-3 и DR-4) была разработана комплексная модель для оценки крипто-проектов на ранней стадии. Этот алгоритм предназначен для двух основных задач: фильтрации большого числа проектов (задача A) и принятия решений о входе/выходе для конкретного проекта (задача B). Модель опирается исключительно на публично доступные данные до события $T_{event}$ и учитывает как количественные, так и качественные метрики, а также поведенческие сигналы.Задание А: Фильтр для первичного отбора («соискательский» фильтр)Эта часть алгоритма предназначена для быстрой фильтрации проектов из широкого пула, чтобы отсеять как «пустые» новички, так и уже «перекупленные» проекты, которые не подходят для краткосрочной спекуляции. Фильтры работают по принципу булева (True/False), где проект должен соответствовать всем критериям, чтобы пройти.Критерии фильтрации:Инвестиции (investment_filter): Проект должен иметь подтвержденный раунд финансирования (pre-seed, seed или private) с привлечением не менее 2 млн USD.1 Кроме того, в списке инвесторов должен присутствовать хотя бы один фонд Tier-1 (например, Paradigm, a16z, Polychain Capital).4Обоснование: Наличие институциональной поддержки является одним из самых сильных сигналов, поскольку подразумевает прохождение проектом профессиональной проверки. Сумма финансирования выше $2 млн подтверждает серьезность намерений, но не делает проект «слишком большим» для ранней стадии.Продукт/Ончейн-активность (product_filter): На момент анализа у проекта должен быть действующий продукт или, по крайней мере, активный тестнет с измеримой ончейн-активностью.Обоснование: Это позволяет отсеять проекты, основанные исключительно на whitepaper и маркетинге. Для проектов категории DeFi, наличие TVL более 10 млн USD (без аномального всплеска за последние 30 дней) является сильным показателем соответствия продукта рынку.6Комьюнити-сигналы (community_filter): Проект должен иметь как минимум один активный официальный публичный канал (сайт, X/Twitter, Discord) с обновлениями в течение последних 90 дней.1 Наличие программы «фарминга поинтов» также является положительным сигналом.2Обоснование: Активная коммуникация и наличие программы лояльности свидетельствуют о долгосрочном видении проекта и его стремлении к созданию устойчивого сообщества.Задание В: Алгоритм принятия решения по конкретному проектуЭтот алгоритм представляет собой многофакторную модель скоринга. Он присваивает каждому проекту числовую оценку на основе взвешенной суммы различных показателей.1. Взвешенная формула скоринга$$ \text{Project_Score} = (w_{inv} \times \text{Score}{\text{Tier1_Inv}}) + (w{\text{fund}} \times \text{Score}{\text{Fundraising}}) + (w{\text{tvl}} \times \text{Score}{\text{TVL}}) + (w{\text{comm}} \times \text{Score}{\text{Points}}) - (w{\text{neg}} \times \text{Score}_{\text{Negative}}) $$Score — Нормализованные значения показателей, которые мы получаем из внешних источников.w — Весовые коэффициенты, которые отражают важность каждого сигнала.2. Определение метрик и весовМетрика (Score)Вес (w)Диапазон/ПорогОбоснованиеTier-1 Инвесторы (Score_Tier1_Inv)0.4 (Высокий)2.0 (если есть тандем Paradigm+a16z); 1.0 (если есть 1+ Tier-1 инвестор); 0.0 (нет Tier-1).Наличие Tier-1 инвесторов — самый сильный сигнал о качестве и потенциале проекта.4 Совместные инвестиции (тандем) увеличивают уверенность.24Фандрайзинг (Score_Fundraising)0.2 (Средний)log10(x) от общей суммы в USD.Абсолютная сумма привлеченных средств является прямым индикатором внешней оценки проекта.26 Логарифмирование нормализует разброс значений.TVL / Активность (Score_TVL)0.3 (Высокий)log10(x) от TVL в USD. 0.0 если < $10M.Реальная пользовательская активность (TVL) — лучший индикатор жизнеспособности продукта до появления токена.6Программа поинтов (Score_Points)0.1 (Низкий)1.0 (если есть); 0.0 (если нет).Поведенческий прокси для оценки вовлеченности сообщества, но без гарантий успеха.2Негативные сигналы (Score_Negative)0.5 (Отрицательный)1.0 (если есть); 0.0 (если нет).Критические «красные флаги», способные обвалить цену, даже если остальные метрики высоки. Например, резкий всплеск ончейн-активности, который выглядит как «сибил-фарминг» 28, или публичные жалобы на «несправедливый» airdrop.303. Правила «override» и обработка конфликтовOverride «Fair Launch»: Если проект (например, Hyperliquid 33) явно заявляет об отсутствии венчурных инвесторов, то Score_Tier1_Inv и Score_Fundraising не обнуляются, а получают нейтральное значение 0.5, что исключает их негативное влияние на общий скор. Веса w_tvl и w_comm в этом случае увеличиваются.Override «Лаунчпад»: Если проект запускается через ведущие платформы (Binance Launchpad, Polkastarter), то это автоматически добавляет 1.0 к общему скору. Это связано с тем, что эти платформы проводят собственную проверку проектов.35Конфликт сигналов: Если Score_Negative активируется (например, обнаружена сибил-активность), то это понижает общий скор, даже если другие метрики (например, TVL) высоки. Этот сигнал должен служить «стоп-лоссом» для входа.4. Сценарии входа/выходаAirdrop (вход)Вход: Накопление поинтов или выполнение активностей (свопы, бриджи, предоставление ликвидности) задолго до $T_{event}$.10Выход: Фиксация прибыли в течение 24-72 часов после листинга на CEX/DEX. Цель — продать на «хаях» (peak_price_in_window), пока не сработало давление продаж.35Отмена: Отказ от участия, если появляются признаки «несправедливого» распределения или «сибил-фарминга».30Sales (вход)Вход: Покупка токенов по официальной цене аллокации. Это требует предварительного участия в whitelist или IDO.35Выход: Продажа в течение 24-72 часов после $T_{event}$ с целью достижения мультипликатора 2x или 5x от цены аллокации.35Отмена: Отказ от участия, если проект имеет сомнительную репутацию (как в случае с Pump.fun 50), или его ценообразование кажется завышенным.5. Ограничения алгоритмаКраткосрочная применимость: Модель предназначена исключительно для спекуляций в краткосрочном окне (до 7 дней) и не дает прогнозов на долгосрочную жизнеспособность проекта.51Смещение выживших: Алгоритм основан на анализе преимущественно успешных проектов, что может завышать вероятность успеха. Он не может предсказать «черных лебедей» или изменения в рыночных настроениях.53Зависимость от данных: Модель сильно зависит от доступности и точности публичных данных, особенно от агрегаторов, чьи методологии могут быть непрозрачными.54Приложение: «filters_for_scouting.md»Фильтры для первичного скаутинга крипто-проектовЭтот документ содержит набор первичных, воспроизводимых фильтров, предназначенных для быстрого отбора ранних проектов, имеющих потенциал для краткосрочной спекуляции. Фильтры основаны на публично доступных данных до события $T_{event}$ (первый ликвидный листинг).Критерий 1: Финансирование и инвесторыТребование: Проект привлек не менее $2,000,000 USD в раундах seed/private.1Уточнение: В списке инвесторов должен присутствовать хотя бы один фонд уровня Tier-1 (например, Paradigm, a16z, Polychain, Multicoin Capital, Electric Capital).4Источник: CryptoRank, DropsTab, ICODrops или официальные анонсы проекта.Критерий 2: Продукт и ончейн-активностьТребование: Наличие действующего продукта (mainnet/beta), а не только идеи или whitepaper.Уточнение (для DeFi): TVL (Total Value Locked) должен быть выше $10,000,000 USD в течение как минимум 30 дней, предшествующих $T_{event}$, без резких аномальных всплесков.6Уточнение (для других категорий): Наличие подтвержденного пользовательского кейса (например, >10k активных адресов в месяц) или значительного объема транзакций.Источник: DeFiLlama, официальные блоги/docs проекта.Критерий 3: Коммуникация и сообществоТребование: Проект поддерживает как минимум один из следующих официальных каналов с публичными обновлениями за последние 90 дней:Активный X/Twitter-аккаунт.Активный Discord-сервер с анонсами.Активный блог (Medium, Mirror, Substack).1Уточнение: Наличие публично объявленной программы «фарминга поинтов» или аналогичной активности для вознаграждения ранних пользователей является дополнительным преимуществом.2Примечание: Проекты, не соответствующие всем трем критериям, считаются недостаточно зрелыми или прозрачными для входа на ранней стадии и исключаются из дальнейшего анализа.Приложение: scoring_spec.jsonJSON{
  "algorithm_name": "Early-Stage Crypto Scoring",
  "version": "1.0",
  "description": "Алгоритм для оценки ранних крипто-проектов на основе общедоступных данных до события (airdrop/sale) для принятия краткосрочных спекулятивных решений.",
  "inputs":,
      "description": "Сегмент рынка проекта. Используется для нормализации."
    },
    {
      "field": "pre_event_funding_total_usd",
      "type": "number",
      "description": "Сумма привлеченных средств в USD до T_event. Источники: CryptoRank, DropsTab."
    },
    {
      "field": "pre_event_tier1_investors_count",
      "type": "integer",
      "description": "Количество инвесторов уровня Tier-1 (Paradigm, a16z, Polychain) в ранних раундах. Источники: CryptoRank, DropsTab."
    },
    {
      "field": "pre_event_co_investor_syndicate",
      "type": "boolean",
      "description": "Флаг наличия совместных инвестиций от нескольких Tier-1 фондов (например, Paradigm + a16z). Источники: DR-4."
    },
    {
      "field": "pre_event_tvl_usd",
      "type": "number",
      "description": "Total Value Locked в USD за 30 дней до T_event. Источник: DeFiLlama. Применимо к DeFi-проектам."
    },
    {
      "field": "pre_event_tvl_change_90d",
      "type": "number",
      "description": "Процентное изменение TVL за 90 дней до T_event. Используется для обнаружения аномальных всплесков."
    },
    {
      "field": "pre_event_onchain_activity_spike_90d",
      "type": "boolean",
      "description": "Флаг, указывающий на аномальный всплеск количества активных адресов или транзакций за 90 дней до T_event."
    },
    {
      "field": "pre_event_points_program_exists",
      "type": "boolean",
      "description": "Флаг, указывающий на наличие публичной программы «фарминга поинтов»."
    },
    {
      "field": "pre_event_aggregator_social_score",
      "type": "number",
      "description": "Рейтинг социальных сетей от агрегатора (например, ICODrops). Низкий уровень доверия. Диапазон: 1..3000."
    },
    {
      "field": "pre_event_community_backlash",
      "type": "boolean",
      "description": "Флаг, указывающий на публичное недовольство сообщества (например, из-за несправедливого airdrop или изменения правил)."
    },
    {
      "field": "pre_event_launchpad_partner",
      "type": "string",
      "description": "Название лаунчпада/биржи, если анонсирован листинг (например, Binance, Polkastarter). Используется для override-правил."
    },
    {
      "field": "T_event_date",
      "type": "string",
      "description": "Дата первого ликвидного торга/аирдропа."
    }
  ]
}

