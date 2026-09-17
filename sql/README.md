# SkillGRID localhost SQL import

These files provide a MySQL/MariaDB database you can import with XAMPP, WAMP, Laragon, Docker, MySQL Workbench, or phpMyAdmin.

## Import with phpMyAdmin

1. Start Apache and MySQL in XAMPP/WAMP/Laragon.
2. Open `http://localhost/phpmyadmin`.
3. Select the **Import** tab.
4. Import `schema.mysql.sql` first.
5. Import `seed.mysql.sql` second.
6. The database is created as `skillgrid`.

## Import with the MySQL command line

From the project folder:

```bash
mysql -u root -p < sql/schema.mysql.sql
mysql -u root -p skillgrid < sql/seed.mysql.sql
```

If your local root account has no password, press Enter when prompted.

## Demo accounts

All imported demo accounts use the password `password`:

- `alice@demo.edu`
- `ben@demo.edu`
- `cara@demo.edu`
- `dexter@demo.com`
- `admin@skillgrid.com` (administrator)

Change or remove these accounts before using the database outside localhost.

## Important: connecting the website

The current website runtime still uses SQLite through `config/db.js`. These SQL files are a complete MySQL/MariaDB import for localhost, but importing them alone does not switch the Node.js application to MySQL.

To use this database from the website, the data-access layer must be migrated from `better-sqlite3` to a MySQL driver such as `mysql2`, and `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` must be added to the environment. Keep the current SQLite setup for the fastest local demo, or request the MySQL runtime migration as a separate change.
