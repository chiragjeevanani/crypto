import sys

def solve():
    line1 = sys.stdin.readline().split()
    if not line1:
        return
    n, h = map(int, line1)
    prices = list(map(int, sys.stdin.readline().split()))

    # After t days, the height of a tree is h + 1 + 2 + ... + t = h + t*(t+1)/2.
    # We cut one tree per day for n days.
    # Total income = Sum_{t=1 to n} (h + t*(t+1)/2) * p_i
    # To maximize this, we should assign larger multipliers t*(t+1)/2 to larger prices p_i.
    # Thus, the tree cut on day t should have the t-th smallest price if we sort prices non-decreasingly.
    
    prices.sort()
    
    ans = 0
    MOD = 10**9 + 7
    
    for i in range(n):
        day = i + 1
        multiplier = (h + (day * (day + 1)) // 2) % MOD
        ans = (ans + multiplier * prices[i]) % MOD
        
    print(ans)

if __name__ == '__main__':
    solve()
