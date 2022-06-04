def decide_prime_number(n):
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

for i in range(2, 100):
    if decide_prime_number(i):
        print(i)
