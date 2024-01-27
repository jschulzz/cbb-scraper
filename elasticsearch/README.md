## ElasticSearch/Kibana startup

`cd elasticsearch && docker-compose up -d`

Since I'm running this on a Windows machine, I have to do some other commands to allocate enough memory:

`wsl -d docker-desktop`

`sysctl -w vm.max_map_count=262144`
