import client
import server

def main():
    i = input("[o:online s:server h:hotseat]: ")
    if i == 'h':
        return client.mode_hotseat()
    if i == 'o':
        return client.mode_online()
    if i == 's':
        return server.start()

main()
