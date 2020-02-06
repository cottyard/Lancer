import client
import server

def main():
    i = input("[o:online h:hotseat]: ")
    if i == 'h':
        return client.mode_hotseat()
    if i == 'o':
        return client.mode_online()

main()
