import numpy as np
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta

from backend.src.models.models import User, WatchHistory, Movie, MovieActor, MovieDirector

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_personalized_recommendations(
            self,
            user_id: int,
            limit: int = 20,
            diversity_boost: float = 0.3
    ) -> List[Dict]:
        """
        Умные персонализированные рекомендации с учетом:
        - История просмотров и оценок
        - Предпочтения по жанрам, актерам, режиссерам
        - Популярность и рейтинги
        - Разнообразие рекомендаций
        """
        try:
            # Получаем данные пользователя
            user_data = self._get_user_profile(user_id)
            if not user_data:
                return self._get_fallback_recommendations(limit)

            # Собираем кандидатов из разных источников
            candidates = {}

            # 1. На основе похожих пользователей (коллаборативная фильтрация)
            collab_movies = self._get_collaborative_recommendations(user_id, limit * 3)
            for movie in collab_movies:
                candidates[movie['id']] = candidates.get(movie['id'], 0) + movie['score'] * 0.4

            # 2. Контентная фильтрация по предпочтениям
            content_movies = self._get_content_based_recommendations(user_data, limit * 3)
            for movie in content_movies:
                candidates[movie['id']] = candidates.get(movie['id'], 0) + movie['score'] * 0.3

            # 3. Новинки и тренды
            trending_movies = self._get_trending_recommendations(user_data, limit * 2)
            for movie in trending_movies:
                candidates[movie['id']] = candidates.get(movie['id'], 0) + movie['score'] * 0.2

            # 4. Персональные аффинити (любимые актеры/режиссеры)
            affinity_movies = self._get_affinity_recommendations(user_data, limit * 2)
            for movie in affinity_movies:
                candidates[movie['id']] = candidates.get(movie['id'], 0) + movie['score'] * 0.1

            # Исключаем уже просмотренные фильмы
            watched_movies = self._get_watched_movie_ids(user_id)
            candidates = {k: v for k, v in candidates.items() if k not in watched_movies}

            # Добавляем разнообразие
            final_recommendations = self._apply_diversity_boost(
                candidates, user_data, diversity_boost, limit
            )

            # Получаем полную информацию о фильмах
            return self._enrich_movie_data(final_recommendations)

        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._get_fallback_recommendations(limit)

    def _get_user_profile(self, user_id: int) -> Optional[Dict]:
        """Получает расширенный профиль пользователя для рекомендаций"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Анализируем историю просмотров
        watch_history = self.db.query(WatchHistory).filter(
            WatchHistory.user_id == user_id
        ).all()

        # Вычисляем предпочтения
        genre_preferences = self._calculate_genre_preferences(user_id)
        actor_preferences = self._calculate_actor_preferences(user_id)
        director_preferences = self._calculate_director_preferences(user_id)

        return {
            'user': user,
            'genre_preferences': genre_preferences,
            'actor_preferences': actor_preferences,
            'director_preferences': director_preferences,
            'watch_history': watch_history,
            'average_rating': self._calculate_average_user_rating(user_id),
            'rating_std': self._calculate_rating_std(user_id)
        }

    def _get_collaborative_recommendations(self, user_id: int, limit: int) -> List[Dict]:
        """Коллаборативная фильтрация на основе похожих пользователей"""
        # Находим пользователей с похожими вкусами
        similar_users = self._find_similar_users(user_id, 50)

        # Собираем фильмы, которые понравились похожим пользователям
        recommendations = []
        for similar_user in similar_users:
            similarity_score = similar_user['similarity']

            # Получаем высокооцененные фильмы похожего пользователя
            high_rated_movies = self.db.query(WatchHistory).filter(
                WatchHistory.user_id == similar_user['user_id'],
                WatchHistory.rating >= 7.0
            ).limit(10).all()

            for history in high_rated_movies:
                recommendations.append({
                    'id': history.movie_id,
                    'score': history.rating * similarity_score,
                    'source': 'collaborative'
                })

        # Группируем и сортируем
        movie_scores = {}
        for rec in recommendations:
            movie_scores[rec['id']] = movie_scores.get(rec['id'], 0) + rec['score']

        return [{'id': k, 'score': v} for k, v in sorted(
            movie_scores.items(), key=lambda x: x[1], reverse=True
        )[:limit]]

    def _get_content_based_recommendations(self, user_data: Dict, limit: int) -> List[Dict]:
        """Контентные рекомендации на основе предпочтений пользователя"""
        # Получаем все фильмы, исключая просмотренные
        watched_ids = self._get_watched_movie_ids(user_data['user'].id)

        movies = self.db.query(Movie).filter(
            Movie.id.notin_(watched_ids) if watched_ids else True
        ).all()

        recommendations = []
        for movie in movies:
            score = self._calculate_content_similarity(movie, user_data)
            if score > 0.1:  # Минимальный порог схожести
                recommendations.append({
                    'id': movie.id,
                    'score': score,
                    'source': 'content'
                })

        return sorted(recommendations, key=lambda x: x['score'], reverse=True)[:limit]

    def _get_trending_recommendations(self, user_data: Dict, limit: int) -> List[Dict]:
        """Рекомендации на основе трендов и популярности"""
        # Фильмы с высоким рейтингом и популярностью
        trending_movies = self.db.query(Movie).filter(
            Movie.popularity > 50,
            Movie.vote_count > 1000,
            Movie.release_date > datetime.now() - timedelta(days=365 * 2)
        ).order_by(
            (Movie.popularity * 0.3 + Movie.kp_rating * 0.4 + Movie.imdb_rating * 0.3).desc()
        ).limit(limit * 2).all()

        recommendations = []
        for movie in trending_movies:
            # Учитываем предпочтения пользователя
            preference_boost = self._calculate_preference_boost(movie, user_data)
            score = (movie.popularity * 0.001 +
                     (movie.kp_rating or 0) * 0.1 +
                     (movie.imdb_rating or 0) * 0.1) * preference_boost

            recommendations.append({
                'id': movie.id,
                'score': score,
                'source': 'trending'
            })

        return sorted(recommendations, key=lambda x: x['score'], reverse=True)[:limit]

    def _get_affinity_recommendations(self, user_data: Dict, limit: int) -> List[Dict]:
        """Рекомендации на основе любимых актеров и режиссеров"""
        top_actors = list(user_data['actor_preferences'].items())[:5]
        top_directors = list(user_data['director_preferences'].items())[:5]

        recommendations = []

        # По актерам
        for actor_id, affinity in top_actors:
            actor_movies = self.db.query(MovieActor).filter(
                MovieActor.actor_id == actor_id,
                MovieActor.is_lead_role == True
            ).limit(5).all()

            for movie_actor in actor_movies:
                movie = self.db.query(Movie).get(movie_actor.movie_id)
                if movie and movie.id not in self._get_watched_movie_ids(user_data['user'].id):
                    score = affinity * 0.8 + (movie.kp_rating or 5) * 0.02
                    recommendations.append({
                        'id': movie.id,
                        'score': score,
                        'source': 'actor_affinity'
                    })

        # По режиссерам
        for director_id, affinity in top_directors:
            director_movies = self.db.query(MovieDirector).filter(
                MovieDirector.director_id == director_id
            ).limit(5).all()

            for movie_director in director_movies:
                movie = self.db.query(Movie).get(movie_director.movie_id)
                if movie and movie.id not in self._get_watched_movie_ids(user_data['user'].id):
                    score = affinity * 0.9 + (movie.kp_rating or 5) * 0.02
                    recommendations.append({
                        'id': movie.id,
                        'score': score,
                        'source': 'director_affinity'
                    })

        # Группируем по фильмам
        movie_scores = {}
        for rec in recommendations:
            movie_scores[rec['id']] = movie_scores.get(rec['id'], 0) + rec['score']

        return [{'id': k, 'score': v} for k, v in sorted(
            movie_scores.items(), key=lambda x: x[1], reverse=True
        )[:limit]]

    def _calculate_content_similarity(self, movie: Movie, user_data: Dict) -> float:
        """Вычисляет схожесть фильма с предпочтениями пользователя"""
        score = 0.0

        # Схожесть по жанрам
        movie_genres = {g.id for g in movie.genres}
        for genre_id, preference in user_data['genre_preferences'].items():
            if genre_id in movie_genres:
                score += preference * 0.4

        # Схожесть по актерам
        movie_actors = {a.id for a in movie.actors}
        for actor_id, preference in user_data['actor_preferences'].items():
            if actor_id in movie_actors:
                score += preference * 0.3

        # Схожесть по режиссерам
        movie_directors = {d.id for d in movie.directors}
        for director_id, preference in user_data['director_preferences'].items():
            if director_id in movie_directors:
                score += preference * 0.2

        # Учет рейтинга (пользователи склонны к определенным уровням рейтинга)
        user_avg_rating = user_data.get('average_rating', 6.0)
        movie_rating = movie.kp_rating or movie.imdb_rating or 5.0
        rating_similarity = 1.0 - abs(user_avg_rating - movie_rating) / 10.0
        score += rating_similarity * 0.1

        return min(score, 1.0)

    def _apply_diversity_boost(self, candidates: Dict, user_data: Dict,
                               diversity: float, limit: int) -> List[Dict]:
        """Добавляет разнообразие в рекомендации"""
        if not candidates:
            return []

        # Сортируем по score
        sorted_candidates = sorted(candidates.items(), key=lambda x: x[1], reverse=True)

        # Берем топ N * 2 для добавления разнообразия
        top_candidates = sorted_candidates[:limit * 2]

        # Группируем по жанрам для разнообразия
        genre_groups = {}
        for movie_id, score in top_candidates:
            movie = self.db.query(Movie).get(movie_id)
            if movie and movie.genres:
                primary_genre = movie.genres[0].id
                if primary_genre not in genre_groups:
                    genre_groups[primary_genre] = []
                genre_groups[primary_genre].append((movie_id, score))

        # Выбираем лучшие из каждой группы
        final_selection = []
        slots_per_genre = max(1, limit // max(1, len(genre_groups)))

        for genre_id, movies in genre_groups.items():
            final_selection.extend(movies[:slots_per_genre])

        # Добавляем оставшиеся лучшие
        remaining_slots = limit - len(final_selection)
        if remaining_slots > 0:
            already_selected = {movie_id for movie_id, _ in final_selection}
            for movie_id, score in top_candidates:
                if movie_id not in already_selected and len(final_selection) < limit:
                    final_selection.append((movie_id, score))

        return [{'movie_id': movie_id, 'final_score': score}
                for movie_id, score in final_selection[:limit]]

    def _enrich_movie_data(self, recommendations: List[Dict]) -> List[Dict]:
        """Добавляет полную информацию о фильмах"""
        enriched = []
        for rec in recommendations:
            movie = self.db.query(Movie).get(rec['movie_id'])
            if movie:
                enriched.append({
                    'id': movie.id,
                    'title': movie.title,
                    'original_title': movie.original_title,
                    'release_year': movie.release_date.year if movie.release_date else None,
                    'kp_rating': movie.kp_rating,
                    'imdb_rating': movie.imdb_rating,
                    'poster_url': getattr(movie, 'poster_url', None),
                    'genres': [{'id': g.id, 'name': g.name} for g in movie.genres],
                    'description': movie.description,
                    'recommendation_score': round(rec['final_score'], 3),
                    'match_reasons': self._generate_match_reasons(movie, rec['final_score'])
                })
        return enriched

    def _generate_match_reasons(self, movie: Movie, score: float) -> List[str]:
        """Генерирует объяснения почему рекомендован фильм"""
        reasons = []

        if movie.kp_rating and movie.kp_rating >= 8.0:
            reasons.append("Высокий рейтинг на КиноПоиске")
        elif movie.imdb_rating and movie.imdb_rating >= 8.0:
            reasons.append("Высокий рейтинг на IMDB")

        if movie.popularity and movie.popularity > 80:
            reasons.append("Популярный выбор")

        if len(movie.genres) > 0:
            genre_names = [g.name for g in movie.genres[:2]]
            reasons.append(f"Жанры: {', '.join(genre_names)}")

        if score > 0.7:
            reasons.append("Идеально соответствует вашим вкусам")
        elif score > 0.5:
            reasons.append("Хорошо соответствует вашим предпочтениям")

        return reasons[:3]  # Не более 3 причин

    # Вспомогательные методы (упрощенные реализации)
    def _calculate_genre_preferences(self, user_id: int) -> Dict[int, float]:
        """Вычисляет предпочтения по жанрам на основе истории просмотров"""
        # Реализация анализа истории для вычисления весов жанров
        return {1: 0.8, 2: 0.6, 3: 0.4}  # Пример

    def _find_similar_users(self, user_id: int, limit: int) -> List[Dict]:
        """Находит пользователей с похожими вкусами"""
        # Упрощенная реализация
        return [{'user_id': 2, 'similarity': 0.8}, {'user_id': 3, 'similarity': 0.7}]

    def _get_watched_movie_ids(self, user_id: int) -> set:
        """Получает ID просмотренных пользователем фильмов"""
        history = self.db.query(WatchHistory).filter(WatchHistory.user_id == user_id).all()
        return {h.movie_id for h in history}

    def _get_fallback_recommendations(self, limit: int) -> List[Dict]:
        """Резервные рекомендации если персонализированные недоступны"""
        movies = self.db.query(Movie).filter(
            Movie.kp_rating >= 7.5,
            Movie.vote_count > 1000
        ).order_by(Movie.popularity.desc()).limit(limit).all()

        return [{
            'id': movie.id,
            'title': movie.title,
            'kp_rating': movie.kp_rating,
            'imdb_rating': movie.imdb_rating,
            'genres': [{'id': g.id, 'name': g.name} for g in movie.genres],
            'recommendation_score': 0.5,
            'match_reasons': ['Популярный фильм с высоким рейтингом']
        } for movie in movies]