import client

def main():
    i = input("[ <o>:online match <r>:recover online match <h>:hotseat ]: ")
    if i == 'h':
        return client.mode_hotseat()
    if i == 'o':
        return client.mode_online()
    if i == 'r':
        return client.mode_recover()

main()
