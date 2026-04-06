import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api/v1';

export const fakeBooks = [
  { _id: 'book1', title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction', averageRating: 4.5, reviewCount: 10 },
  { _id: 'book2', title: '1984', author: 'George Orwell', genre: 'Fiction', averageRating: 4.8, reviewCount: 20 },
];

export const fakeBook = {
  _id: 'book123',
  title: 'Dune',
  author: 'Frank Herbert',
  genre: 'Science Fiction',
  description: 'A science fiction masterpiece.',
  averageRating: 4.5,
  reviewCount: 1,
};

export const handlers = [
  http.get(`${BASE}/books`, () =>
    HttpResponse.json({ data: fakeBooks, totalCount: 2, hasNextPage: false, page: 1, totalPages: 1, limit: 12 })
  ),

  http.get(`${BASE}/books/book123`, () =>
    HttpResponse.json(fakeBook)
  ),

  http.get(`${BASE}/books/book123/reviews`, () =>
    HttpResponse.json({ reviews: [], totalCount: 0, hasNextPage: false, page: 1, totalPages: 0 })
  ),

  http.get(`${BASE}/favorites/book123/status`, () =>
    HttpResponse.json({ favorited: false })
  ),

  http.get(`${BASE}/reading-list/book123/status`, () =>
    HttpResponse.json({ status: null })
  ),

  http.post(`${BASE}/reviews/book123`, () =>
    HttpResponse.json(
      { _id: 'rev1', rating: 5, comment: 'Amazing!', user: { name: 'Alice' } },
      { status: 201 }
    )
  ),
];
