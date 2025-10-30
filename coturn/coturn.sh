sudo docker run --name coturn \
  -p 3478:3478 -p 3478:3478/udp \
  -p 5349:5349 -p 5349:5349/udp \
  -p 49100-49200:49100-49200/udp \
  -v /root/turnserver.conf:/etc/coturn/turnserver.conf \
  coturn/coturn:4.6.3