# Database Normalization
This is my practical implementation of Database Normalisation specifically 5NF, from my first session with Colin through FCDC.
I'll be using Express/nodejs for my backend, and better-sqlite3 For the library database.

## Database
A practical library database would usually have a couple of tables which include users, books and checkout system. This database had the following [tables](./backend/database/schema.js) ; 
- Users(Librarian, user), Users table would consist of a couple of columns
   |id|  name  | phone | username | passwords | Role |
   |--|--------|-------|----------|-----------|------|
   | 1|John Doe|0628***|  JDoe    |jjkj*h82h92| User |
   |Alice carter|05643**| Alice | iown!0-@34|Librarian|
- Books table, a book table would be more complex than a user table. Books have more characteristics in them, which include genres, authors, editions, physical books etc. All these details would not fit in one table, putting them in one table would violate the 1NF rule which states that columns in table should manitain atomicity, only one value should be inside a column. So since I have to adhere to this rule, I had to create a table for each book trait and link them to their respective book.
  ![book architecture](frontend/public/books.png)
- Checkouts, The checkout table contained columns of foreign keys ids of users(book borrowers) and (librarian), checkout time and book return time
  | id | borrower_id | librarian_id | checkout_at | returned_at|
  |----|-------------|--------------|-------------|------------|
  | 1  |   43        |     2        | 16 jun 2026 |  NULL      |
- Checkout Entries, This table records actual physical book to a specific checkout event, a single checkout transaction can contain anywhere from one to hundreds of physical books, fully complying with First Normal Form (1NF).
  | id | checkout_id | physical_book_id|
  |----|-------------|-----------------|
  | 2  |  1          |     21          |
