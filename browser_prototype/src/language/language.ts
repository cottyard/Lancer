interface IDisposable {
    dispose(): void;
}

function using<T extends IDisposable>(resource: T, func: (resource: T) => void) {
    try {
        func(resource);
    } finally {
        resource.dispose();
    }
}

interface IHashable {
    hash(): string;
}

class HashMap<K extends IHashable, V>
{
    private map = new Map<string, V>();
    constructor(init: [K, V][] = [])
    {
        let key, value;
        for ([key, value] of init)
        {
            this.put(key, value);
        }
    }

    put(key: K, value: V): void
    {
        this.map.set(key.hash(), value);
    }

    get(key: K): V | undefined
    {
        return this.map.get(key.hash());
    }
}
