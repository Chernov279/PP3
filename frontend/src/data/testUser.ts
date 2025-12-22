export const TEST_USER = {
  email: 'test@kinorek.ru',
  password: '123456',
  name: 'Тестовый Пользователь'
};

// Инициализация тестового пользователя в localStorage
export const initTestUser = () => {
  const users = localStorage.getItem('kinorek_users');
  
  if (!users) {
    const testUserData = {
      [TEST_USER.email]: {
        password: TEST_USER.password,
        userData: {
          id: 'test-user-1',
          email: TEST_USER.email,
          name: TEST_USER.name,
          profile: {
            favoriteGenres: ['Драма', 'Триллер'],
            favoriteActors: ['Леонардо ДиКаприо', 'Кристиан Бейл'],
            watchedMovies: [1, 2, 3],
            favoriteMovies: [1, 5],
            imdbConnected: false,
            kinopoiskConnected: true,
          }
        }
      }
    };
    
    localStorage.setItem('kinorek_users', JSON.stringify(testUserData));
  }
};
