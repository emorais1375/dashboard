# Backup
docker exec CONTAINER /usr/bin/mysqldump -u root --password=password arko_db_v2 > backup.sql

# Restore
cat backup.sql | docker exec -i CONTAINER /usr/bin/mysql -u root --password=password arko_db_v2