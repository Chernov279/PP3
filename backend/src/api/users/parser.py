import httpx
import asyncio
from typing import List, Dict, Any, Optional

GRAPHQL_URL = "https://graphql.kinopoisk.ru/graphql/"
QUERY = """query UserReactionMovies($isAuthorized: Boolean!, $socialAlias: String!, $includeTypes: [ReactionType!]!, $limit: Int!, $offset: Int!) { userProfileBySocialAlias(socialAlias: {socialAlias: $socialAlias}) { ...SocialUserProfileId userData { movieReactions(limit: $limit, offset: $offset, includeTypes: $includeTypes) { items { ...UserReaction __typename } total limit offset __typename } __typename } __typename } } fragment RatingValue on RatingValue { value isActive count __typename } fragment MovieForPoster on Movie { id title { russian original __typename } poster { avatarsUrl __typename } genres { id name __typename } rating { kinopoisk { ...RatingValue __typename } __typename } userData @include(if: $isAuthorized) { watchStatuses { watched { value __typename } __typename } __typename } viewOption { buttonText isAvailableOnline: isWatchable(filter: {anyDevice: false, anyRegion: false}) purchasabilityStatus contentPackageToBuy { billingFeatureName __typename } subscriptionBadge { image { avatarsUrl __typename } __typename } type posterWithRightholderLogo __typename } ... on Film { productionYear __typename } ... on Video { productionYear __typename } ... on TvSeries { releaseYears { start end __typename } __typename } ... on TvShow { releaseYears { start end __typename } __typename } ... on MiniSeries { releaseYears { start end __typename } __typename } __typename } fragment SocialUserProfileId on UserProfileInterface { id { kpId ottId puid __typename } __typename } fragment UserReaction on UserMovieReactions { movie { ...MovieForPoster contentId __typename } reactions(includeTypes: $includeTypes) { __typename ... on Watched { watched __typename } ... on Vote { value __typename } ... on PlannedToWatch { plannedToWatch __typename } } __typename }"""

async def fetch_user_reactions(
    user_id: str,
    cookies: Dict[str, str],
    limit: int = 20
) -> List[Dict[str, Any]]:
    """
    Получить все фильмы с реакциями пользователя через GraphQL API Кинопоиска.
    Возвращает список элементов movieReactions.
    """
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "ru,en;q=0.9",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Host": "graphql.kinopoisk.ru",
        "Origin": "https://www.kinopoisk.ru",
        "Pragma": "no-cache",
        "Referer": "https://www.kinopoisk.ru/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "service-id": "25",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0",
        "x-preferred-language": "ru",
    }

    all_items = []
    offset = 0

    async with httpx.AsyncClient() as client:
        while True:
            variables = {
                "isAuthorized": True,
                "socialAlias": user_id,
                "includeTypes": ["WATCHED", "VOTE"],
                "limit": limit,
                "offset": offset
            }
            payload = {
                "operationName": "UserReactionMovies",
                "variables": variables,
                "query": QUERY
            }

            response = await client.post(
                GRAPHQL_URL,
                json=payload,
                headers=headers,
                cookies=cookies
            )
            response.raise_for_status()
            data = response.json()

            # Проверка на ошибки GraphQL
            if "errors" in data:
                raise Exception(f"GraphQL errors: {data['errors']}")

            reactions = data["data"]["userProfileBySocialAlias"]["userData"]["movieReactions"]
            items = reactions["items"]
            total = reactions["total"]

            all_items.extend(items)
            offset += limit

            if offset >= total:
                break

            # Небольшая задержка, чтобы не нагружать сервер
            await asyncio.sleep(0.5)

    return all_items